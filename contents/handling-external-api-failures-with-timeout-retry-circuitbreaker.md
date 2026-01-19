---
date: '2025-08-22'
title: 'PG 연동이 실패했을 뿐인데, 왜 우리 서버가 죽어야 하죠?'
categories: ['서킷브레이커']
deploy: true
---

"만약 PG사 서버가 갑자기 다운되면? 네트워크가 불안정해서 응답이 오지 않는다면? 이 결제 요청을 처리하던 우리 서버의 스레드는 어떻게 되는 거지?"

이 질문에 대한 답을 준비하지 않았다면, 그 결과는 끔찍할 수 있습니다. PG사의 응답을 무작정 기다리다 우리 서버의 모든 스레드가 고갈되어, 결국 전체 서비스가 멈춰버리는 대규모 장애로 이어질 수 있습니다.

그렇다면 외부 시스템이라는 통제 불가능한 변수 앞에서, 우리 시스템을 안전하게 지키기 위한 방법에는 어떤 것들이 있을까요?

## 끝까지 기다리면 죽는다: 타임아웃의 힘

PG사의 응답이 5초, 10초씩 지연된다면, 그 요청을 처리하는 우리 서버의 스레드(Thread)는 그 시간 동안 아무것도 못 하고 묶여있게 됩니다.

이런 요청이 몇 개만 동시에 들어와도 가용 스레드는 순식간에 고갈(Thread Pool Exhaustion)되고, 우리 시스템은 더 이상 새로운 요청을 처리하지 못하는 '먹통' 상태가 될 겁니다.

그래서 우리는 외부 API를 호출할 때 최대 대기 시간, 즉 타임아웃을 설정하기로 했습니다. 외부 API를 호출하는 방법으로는 RestTemplate과 FeignClient가 있었는데, 기존 프로젝트에서 RestTemplate은 충분히 사용해 본 경험이 있었습니다.

이번에는 인터페이스 기반으로 더 깔끔하고 선언적으로 API 클라이언트를 만들 수 있는 **FeignClient**를 도입해 보기로 결정했습니다.

FeignClient를 사용하니, 타임아웃 설정 또한 다음과 같이 설정 클래스를 통해 매우 간단하게 관리할 수 있었습니다.

```java
// PgClientConfig.java
@Configuration
public class PgClientConfig {
    @Bean
    public Request.Options feignOptions() {
        return new Request.Options(
                1000, // Connection Timeout: 외부 서버와 연결을 맺기까지 대기 시간 (1초)
                3000  // Read Timeout: 연결은 됐지만, 응답 데이터를 읽어오기까지 대기 시간 (3초)
        );
    }
}

// PgSimulatorClient.java
@FeignClient(name = "pg-client", url = "...", configuration = PgClientConfig.class)
public interface PgSimulatorClient {
    // ...
}
```

이제 우리 시스템은 PG사가 3초 안에 응답을 주지 않으면, 더 이상 기다리지 않고 즉시 연결을 끊고 `feign.RetryableException` (내부적으로는 `SocketTimeoutException`) 예외를 발생시킵니다.

최소한 외부 시스템의 문제 때문에 우리 시스템 전체가 마비되는 최악의 상황은 막을 수 있게 된 것입니다.

## 한 번 더! 재시도로 살아남기

타임아웃만으로는 부족합니다.

네트워크가 잠깐 끊긴 경우라면, 한두 번 더 시도하면 성공할 수도 있습니다.

이것이 바로 **재시도(Retry)** 의 필요성입니다.

하지만 재시도는 양날의 검과 같습니다. 현명하게 사용하면 서비스의 안정성을 크게 높일 수 있지만, 멍청하게 사용하면 오히려 장애를 증폭시키는 재앙이 될 수 있습니다.
가장 먼저, 우리는 재시도할 실패와 하지 말아야 할 실패를 구분해야합니다.

- **재시도하면 안 되는 실패** : '카드 한도 초과', '유효하지 않은 카드 번호'와 같이 몇 번을 다시 시도해도 결과가 절대 바뀌지 않는 명백한 비즈니스 로직 오류입니다. 이런 실패에 재시도를 하는 것은 시스템 자원의 낭비일 뿐입니다. <br/>(주로 HTTP 4xx 계열의 에러)
- **재시도해야 하는 실패** : '일시적인 네트워크 끊김', 'PG사 서버의 순간적인 과부하(HTTP 503)'처럼, 잠시 후에 다시 시도하면 성공할 가능성이 있는 오류들입니다. 우리의 재시도 전략은 바로 이 실패들을 극복하기 위해 존재합니다.
  <br/>(주로 타임아웃, 네트워크 예외, HTTP 5xx 계열의 에러)

Resilience4j를 사용하면 복잡한 재시도 로직을 애노테이션 하나로 매우 깔끔하게 적용할 수 있습니다.

```yml
# application.yml
resilience4j:
  retry:
    instances:
      pgRetry: # 재시도 정책의 고유한 이름
        max-attempts: 3 # 최대 시도 횟수 (첫 시도를 포함)
        wait-duration: 1s # 각 재시도 사이의 대기 시간 (1초)
        retry-exceptions: # 재시도를 실행할 예외 목록
          - feign.RetryableException
```

이 설정은 "만약 `feign.RetryableException`이 발생하면, 1초 간격으로 최대 3번까지 다시 시도해라" 라는 의미입니다.

그리고 이 정책을 실제 외부 API를 호출하는 Adapter 클래스의 메소드에 @Retry 애노테이션으로 간단하게 적용했습니다.

```java
@Component
@RequiredArgsConstructor
public class PgSimulator implements PaymentAdapter {

    private final PgSimulatorClient client;

    @Override
    // yml에 정의한 'pgRetry' 정책을 이 메소드에 적용한다.
    @Retry(name = "pgRetry", fallbackMethod = "requestFallback")
    public void request(PaymentCommand.Transaction paymentCommand) {
        PgSimulatorRequest.RequestTransaction requestTransaction = Pg... // 요청 객체 생성

        // 이 메소드 호출 시 retry-exceptions에 등록된 예외가 발생하면
        // Resilience4j가 알아서 재시도를 수행해준다.
        client.request("12345", requestTransaction);
    }

    // 모든 재시도가 실패했을 때 호출될 Fallback 메소드
    public void requestFallback(PaymentCommand.Transaction paymentCommand, Throwable throwable) {
        log.error("PG사 연동 재시도 최종 실패", throwable);
        // ... 실패 처리 로직 ...
    }
}
```

### 똑똑한 재시도 전략

상상해봅시다. PG사가 순간적으로 죽었을 때, 100개의 요청이 동시에 실패합니다.
그리고 모든 요청이 정확히 1초 뒤에 다시 동시에 날아간다면?

장애에서 막 회복하려는 서버를 또 쓰러뜨리는 꼴입니다.
이것이 바로 **재시도 폭풍(Retry Storm)** 입니다.

이를 피하기 위해 우리는 **`지수 백오프(Exponential Backoff)`** 와 **`지터(Jitter)`** 를 적용했습니다.

### Exponential Backoff with Jitter

1. Exponential Backoff (지수 백오프)

이 전략의 핵심 아이디어는 "재시도를 거듭할수록 대기 시간을 지수적으로(exponentially) 늘리는 것" 입니다.
첫 번째 실패 시: 1초 대기
두 번째 실패 시: 2초 대기
세 번째 실패 시: 4초 대기

이렇게 하면 장애가 길어질수록 우리 시스템이 외부 시스템에 가하는 부하를 점진적으로 줄여, 상대방이 스스로 회복할 수 있는 충분한 시간을 벌어주게 됩니다.

2. Jitter (지터)

하지만 지수 백오프만으로는 부족합니다. 100개의 요청이 모두 정확히 1초 뒤, 2초 뒤, 4초 뒤에 다시 몰려갈 수 있기 때문입니다. 이 동시성 문제를 해결하기 위해 계산된 대기 시간에 약간의 무작위성(randomness)을 더하는 것이 바로 Jitter입니다.

예를 들어 4초를 대기해야 할 때, 2초에서 6초 사이의 랜덤한 시간 동안 대기하도록 만드는 것입니다. 이 작은 무작위성 덕분에 100개의 재시도 요청은 시간 축에 고르게 분산되어 스파이크(Spike) 없이 부드럽게 전달됩니다.
Resilience4j는 이 모든 것을 application.yml 설정 몇 줄로 우아하게 구현할 수 있게 해줍니다.

```yml
resilience4j:
  retry:
    instances:
      pgRetry:
        max-attempts: 3
        wait-duration: 1s # 초기 대기 시간
        enable-exponential-backoff: true # 지수 백오프 활성화
        exponential-backoff-multiplier: 2 # 대기 시간 증가 배수
        enable-randomized-wait: true # Jitter 활성화
        randomized-wait-factor: 0.5 # Jitter 범위 (+-50%)
        retry-exceptions:
          - feign.RetryableException
          - feign.FeignException.InternalServerError
```

## 차단기는 왜 필요한가: 서킷 브레이커

재시도로도 해결이 안 될 때가 있습니다.

외부 서비스가 완전히 다운되면, 재시도는 의미 없는 자원 낭비가 됩니다.

이때 필요한 것이 **서킷 브레이커(Circuit Breaker)** 입니다.

실패율이 임계치를 넘으면 요청을 차단해 더 큰 피해를 막습니다.

서킷 브레이커는 CLOSE(정상), OPEN(차단), HALF-OPEN(시험) 세 가지 상태를 가집니다.

- CLOSE: 요청을 정상적으로 전달하고, 뒤에서 조용히 실패율을 측정합니다.
- OPEN: 실패율이 임계치를 넘으면, 정해진 시간 동안 모든 요청을 즉시 차단하고 Fallback을 호출합니다. 실제 외부 API 호출은 일어나지 않습니다.
- HALF-OPEN: 차단 시간이 지나면, '정찰병'처럼 테스트 요청 하나만 살짝 보내봅니다. 성공하면 CLOSE로, 실패하면 다시 OPEN으로 돌아갑니다.

다음과 같이 서킷 브레이커 정책을 설정했습니다.

```yml
# application.yml
resilience4j:
  circuitbreaker:
    instances:
      pgCircuit:
        sliding-window-size: 10 # 최근 10번의 호출을 기준으로 판단
        minimum-number-of-calls: 5 # 최소 5번은 호출되어야 판단 시작
        failure-rate-threshold: 50 # 실패율이 50% 이상이면 서킷 OPEN
        wait-duration-in-open-state: 60s # OPEN 상태를 60초간 유지
```

minimum-number-of-calls: 5 설정은 "최소 5번의 호출 샘플이 쌓이기 전까지는 섣불리 서킷을 열지 않겠다"는 의미입니다. 저는 이 설정을 믿고 테스트를 시작했습니다. 그리고 곧바로 엄청난 혼란에 빠졌습니다.

### 아직 열릴 때가 아닌데? Fallback 호출 시점에 대한 나의 착각

처음엔 fallbackMethod가 서킷이 OPEN 되었을 때만 호출되는 비상 대책이라고 생각했습니다.

테스트를 위해 PG사 API를 일부러 실패하게 만들고, 첫 번째 결제 요청을 보냈습니다.
제 예상은 이랬습니다.

> minimum-number-of-calls가 5이니 아직은 CLOSE 상태일 것이다. <br/>
> 따라서 fallbackMethod는 호출되지 않고, 단순히 실패 1건만 기록될 것이다

하지만 결과는 제 예상을 완전히 빗나갔습니다. 단 한 번의 실패였음에도 불구하고, fallbackMethod는 즉시 호출되었습니다.

고민: 왜? 최소 5번은 호출되어야 판단을 시작한다면서, 왜 첫 번째 실패부터 Fallback이 실행되는 거지?

깨달음: 저는 서킷 브레이커의 두 가지 핵심 역할을 혼동하고 있었습니다. @CircuitBreaker는 예외를 감지하면 두 가지 일을 독립적으로, 그리고 동시에 수행합니다.

- **통계 기록 및 상태 변경 (판단)** : 실패가 발생하면 슬라이딩 윈도우에 조용히 기록합니다. <br/>그리고 `minimum-number-of-calls`, `failure-rate-threshold` 같은 '자신만의 엄격한 규정'에 따라 서킷을 OPEN할지 말지를 결정합니다.

- **예외 처리 (대응)** : 하지만 '판단'과는 별개로, 일단 자신의 책임 하에 있는 메소드에서 '처리되지 않은 예외'가 발생했다는 사실 자체를 인지하는 즉시, "상황 발생! 약속된 대체 절차를 수행하라!"며 `fallbackMethod`를 즉시 호출합니다.
  <br/> 즉, fallbackMethod의 실행 조건은 '서킷이 OPEN되는 것'이 아니라, '처리되지 않은 예외가 발생하는 것' 그 자체였던 것입니다.

### 정말 열릴까? 테스트로 확인해보기

저는 "PG사 API 응답이 반복적으로 지연될 때, 정말로 서킷 브레이커가 열려서 요청을 차단하는가?"를 검증하고 싶었습니다. 이를 위해 Spring Boot Test 환경에서 WireMock이라는 Mock Server 라이브러리를 사용했습니다.

먼저, 테스트 환경에서만 동작하는 application-test.yml에 테스트에 최적화된 서킷 브레이커 설정을 정의했습니다. 최소 2번의 실패만으로도 서킷이 열리도록 임계치를 낮게 설정했습니다

```yml
resilience4j:
  circuitbreaker:
    instances:
      pgCircuit:
        sliding-window-size: 2
        minimum-number-of-calls: 2 # 최소 2번 호출되어야 판단 시작
        failure-rate-threshold: 50 # 실패율 50% (2번 중 1번만 실패해도...)
        wait-duration-in-open-state: 5s
```

테스트 코드

```java
// 테스트 환경에서만 동작하는 Feign 타임아웃 설정
@TestConfiguration
static class FeignTestConfig {
    @Bean
    public Request.Options feignOptions() {
        // 응답 타임아웃을 2초로 설정
        return new Request.Options(1000, 2000);
    }
}

@SpringBootTest
@ActiveProfiles("test")
@WireMockTest(httpPort = 8082) // 8082 포트로 Mock 서버 자동 실행
class PgSimulatorCircuitBreakerTest {

    @Autowired
    private PgSimulator pgSimulator; // 테스트 대상 컴포넌트

    private static final int REQUIRED_FAILURES_TO_OPEN_CIRCUIT = 2;

    @Test
    @DisplayName("정해진 횟수 이상 타임아웃 발생 시 서킷이 열리고 CircuitOpenException을 던진다.")
    void circuitOpens_afterMultipleTimeouts() {
        // given: WireMock을 사용해 PG사 API가 4초간 응답을 지연하도록 설정 (Feign 타임아웃 2초 유발)
        stubFor(post("/api/v1/payments")
                .willReturn(aResponse()
                        .withStatus(200)
                        .withFixedDelay(4000) // 4초 지연
                ));

        PaymentCommand.Transaction transaction = ... // 테스트용 결제 Command 생성

        // when: 1. 서킷을 OPEN시키기 위해 의도적으로 2번의 실패를 발생시킨다.
        // 각 호출은 타임아웃으로 인해 PgTimeoutException을 던져야 한다.
        for (int i = 0; i < REQUIRED_FAILURES_TO_OPEN_CIRCUIT; i++) {
            assertThatThrownBy(() -> pgSimulator.request(transaction))
                    .isInstanceOf(PaymentException.PgTimeoutException.class);
        }

        // then: 2. 이제 서킷은 OPEN 상태여야 한다.
        // 다음 호출은 실제 API를 호출하지 않고 즉시 CircuitOpenException을 던져야 한다.
        assertThatThrownBy(() -> pgSimulator.request(transaction))
                .isInstanceOf(PaymentException.CircuitOpenException.class);
    }
}
```

이 테스트 코드의 핵심 전략은 다음과 같습니다.

1. 실패 상황 연출: WireMock의 withFixedDelay(4000)를 사용하여 Feign의 Read Timeout(2초)을 의도적으로 초과시킵니다.
2. 상태 변화 유도: for 루프를 사용하여 minimum-number-of-calls 설정값인 2번의 실패를 강제로 발생시켜 서킷 브레이커의 슬라이딩 윈도우를 채웁니다.
3. 최종 결과 검증: 2번의 실패 이후, 다음 호출에서는 더 이상 타임아웃 예외(PgTimeoutException)가 아닌, 서킷이 열렸음을 의미하는 **CircuitOpenException**이 발생하는지를 assertThatThrownBy로 명확하게 검증합니다.

## 트랜잭션 분리 없이는 결제 시스템이 무너진다

외부 API 연동 시의 일시적인 실패 대응도 중요하지만, 이 과정에서 더 근본적인 문제를 발견했습니다. 바로 데이터베이스 트랜잭션의 범위 문제였습니다.

처음에는 포인트 결제와 카드 결제를 동일한 흐름으로 처리하려 했습니다. 하지만 두 방식의 본질적인 차이를 깨닫고 나니, 이는 데이터 정합성을 파괴할 수 있는 위험한 발상이었습니다.

### 포인트 결제 : 하나의 원자적 트랜잭션

포인트 결제는 외부 시스템 연동이 없는, 순전히 우리 시스템 내부에서 완결되는 작업입니다.

포인트 결제는 외부 연동 없이 우리 시스템 내부에서 완결됩니다. '포인트 차감', '결제 완료 이력 생성', '재고 차감'은 모두 성공하거나 모두 실패해야 하는 원자적(Atomic) 단위입니다.

따라서 이 모든 과정을 하나의 @Transactional로 묶는 것은 당연하고 올바른 설계였습니다.

### 카드 결제: 재앙을 부르는 통합 트랜잭션

하지만 카드 결제에는 '외부 PG사 연동'이라는 통제 불가능한 변수가 끼어듭니다. 만약 이 과정을 포인트 결제처럼 하나의 트랜잭션으로 묶으면 어떻게 될까요? 외부 PG사 API 호출이 실패하여 예외가 발생하면, Spring의 기본 정책에 따라 전체 트랜잭션이 롤백됩니다.

그 결과, API 호출 전에 생성했던 '결제 시도' 기록까지 DB에서 흔적도 없이 사라집니다.
이것은 재앙입니다. PG사에서는 결제가 성공했는데 우리 서버로 오는 응답만 실패한 경우, 고객의 돈은 출금되었지만 우리 DB에는 아무런 기록도 남지 않는 최악의 데이터 불일치가 발생합니다.

외부 PG 연동이 실패하더라도, '결제를 시도했다'는 사실 자체는 반드시 DB에 남아야 하기 때문에

결제 프로세스를 조율하던 PaymentFacade에서 @Transactional을 제거했습니다. Facade는 더 이상 트랜잭션을 관리하지 않고, 각 Processor에게 책임을 위임하는 역할만 수행합니다.

```java
// PaymentFacade.java - 트랜잭션이 없는 오케스트레이터
@Service
@RequiredArgsConstructor
public class PaymentFacade {
    // ...
    // @Transactional 제거!
    public PaymentResult pay(PaymentCriteria.Pay criteria) {
        Order order = orderService.getOrder(criteria.orderId());
        order.validatePay();

        PaymentProcessor paymentProcessor = paymentProcessorMap.get(criteria.paymentMethod().toString());
        Payment payment = paymentProcessor.pay(PaymentProcessContext.of(criteria));

        return PaymentResult.from(payment);
    }
}
```

그리고 CardPaymentProcessor의 로직을 짧은 생명주기를 가진 트랜잭션들로 분리했습니다.

```java
@Component("CARD")
@RequiredArgsConstructor
public class CardPaymentProcessor implements PaymentProcessor {
    // ... 의존성 ...

    @Override
    public Payment pay(PaymentProcessContext context) {
        // ...

        // ★ [트랜잭션 1] 'PENDING' 상태로 결제 이력을 먼저 생성하고 '커밋'한다.
        Payment payment = paymentService.create(..., PaymentStatus.PENDING);

        try {
            // ★ [No Transaction] 트랜잭션 없는 상태에서 안전하게 외부 API를 호출한다.
            paymentAdapter.request(...);

            // ★ [트랜잭션 2] 성공 시, 'PAID' 상태로 업데이트하고 '커밋'한다.
            paymentService.paid(payment.getId());

        } catch (Exception e) {
            // ★ [트랜잭션 3] 실패 시, 'FAILED' 상태로 업데이트하고 '커밋'한다.
            paymentService.fail(payment.getId());
            // 그 후 예외를 전파하여 클라이언트에게 실패를 알린다.
            throw e;
        }

        return payment;
    }
}
```

트랜잭션의 범위를 가능한 한 짧게, 그리고 명확한 책임 단위로 나누는 것은 외부 시스템과 연동하는 애플리케이션의 데이터 정합성과 안정성을 지키는 가장 중요한 원칙이었습니다.

## 맺으며

외부 API 연동은 단순한 기능 구현을 넘어, 우리 시스템 전체의 안정성을 시험하는 중요한 과제였습니다.

타임아웃으로 최소한의 방어벽을 세우고, 재시도로 일시적인 장애를 극복하며, 서킷 브레이커로 시스템 전체를 보호하는 다층 방어 전략을 구축하는 과정은 쉽지 않았습니다.

특히, Fallback의 동작 방식이나 트랜잭션 분리와 같은 문제들은 수많은 고민과 디버깅을 통해 얻어낸 값진 교훈이었습니다.

견고한 시스템은 단번에 만들어지지 않으며, '만약 실패한다면?'이라는 질문을 끊임없이 던지는 과정 속에서 완성된다고 믿습니다.
