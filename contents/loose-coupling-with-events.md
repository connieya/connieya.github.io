---
date: '2025-08-28'
title: 'import 문을 줄이는 가장 우아한 방법 (feat: ApplicationEvent)'
categories: ['application event']
deploy: true
---

요즘 많은 시스템이 **`이벤트 드리븐 아키텍처(EDA)`** 를 채택하고 있습니다. 이제는 이벤트를 활용하지 않는 회사를 찾기 힘들 정도라고 해도 과언이 아닐 겁니다.

'이벤트' 하면 자연스럽게 마이크로서비스 아키텍처(MSA) 나 카프카(Kafka) 같은 키워드들이 떠오릅니다.

하지만 이 글에서는 카프카와 같은 메시지 브로커나 MSA 의 복잡한 구조에 대한 이야기를 하려는 것이 아닙니다.

그보다 더 근본적인 질문, 바로 **'이벤트'** 그 자체에 초점을 맞춰보려고 합니다. 대체 이벤트가 뭐길래 이렇게 많은 곳에서 활용하고 있는 걸까요?

먼저 이벤트가 무엇인지를 살펴봐야 할 것 같습니다. <br/>
이벤트를 제대로 이해하기 위해서는, 우리가 늘 사용하던 **'커맨드(Command)'** 에 대해 알아야 합니다.

## 커맨드 vs 이벤트: 지시와 사실의 차이

개발을 하다 보면 우리는 거의 모든 로직을 **`커맨드(Command)`** 방식으로 작성합니다. <br/> 커맨드란 **시스템의 특정 기능 실행을 지시하는 명시적인 명령** 이라고 할 수 있습니다.

```
"사용자 데이터 저장해."
"상품 재고 수정해."
```

커맨드는 '의도'를 담고 있습니다. "사용자를 생성하라"는 미래의 행동을 지시하며, 호출하는 쪽(주체)이 호출받는 쪽에게 무엇을 해야 할지 명확하게 알고 있습니다.

모든 흐름 제어의 책임은 호출자에게 있습니다. 사용자를 생성한 뒤, 환영 메일을 보내고, 기본 포인트를 지급하는 모든 과정을 호출자가 순서대로 지휘해야 합니다.

반면, **`이벤트(Event)`** 는 완전히 다른 철학을 가집니다. 이벤트는 명령이 아니라, "과거에 일어난 어떤 사건에 대한 사실을 알리는 방송" 과 같습니다.

```
"사용자 가입이 완료되었다."
"주문이 생성되었다."
```

이벤트는 '사실'을 담고 있습니다. "사용자가 가입했다"는 이미 일어난 과거의 상태 변화를 알릴 뿐입니다. <br/>이벤트를 발행하는 쪽(주체)은 이 사실에 관심이 있을 다른 컴포넌트가 누구인지 전혀 알 필요가 없습니다.

흐름 제어의 책임은 발행자가 아닌, 시스템 전체에 분산됩니다. 사용자가 가입했다는 이벤트가 발생하면, 메일 서비스는 그 소식을 듣고 환영 메일을 보내고, 포인트 서비스는 또 그 소식을 듣고 포인트를 지급합니다.

발행자는 그저 "이런 일이 있었다!"라고 알렸을 뿐, 그 이후의 과정에는 관여하지 않습니다.

## 이벤트는 왜 필요할까?

처음에는 서비스가 몇 개 안 되니 커맨드 방식만으로도 충분히 굴러갑니다.

하지만 기능이 늘어나면 서비스 간 호출이 촘촘해지며 서로에게 의존하기 시작합니다.

앞서 이벤트를 “사실을 알리는 것”이라고 정의했는데, 이 특성이 바로 서비스 간 의존성을 줄여주는 열쇠입니다.

즉, 이벤트는 **`느슨한 결합(Loose Coupling)`** 을 가능하게 합니다.

### 의존의 흔적: import 문

제가 생각하는 의존의 정의는 단순합니다.

> “내가 코드를 바꾸면, 다른 쪽도 함께 바꿔야 하는 관계”

이 의존성이 코드에서 가장 명확하게 드러나는 곳이 바로 import 문입니다.

커맨드 방식의 코드는 필연적으로 의존하는 대상의 코드를 import해야 합니다. OrderService가 주문 완료 후 쿠폰 상태를 변경하고, 메일도 보내야 하는 상황을 가정해 봅시다

```java
// 강한 결합의 증거, import 문들
import com.example.coupon.CouponService;
import com.example.notification.EmailService;
import com.example.stock.StockService;

@Service
public class OrderService {
    private final CouponService couponService;
    private final EmailService emailService;
    private final StockService stockService;

    public void placeOrder(...) {
        // 주문 처리 로직 ...
        couponService.use(...); // 쿠폰 서비스에 직접 명령
        emailService.sendOrderCompleted(...); // 이메일 서비스에 직접 명령
        stockService.deduct(...); // 재고 서비스에 직접 명령
    }
}
```

OrderService는 쿠폰, 이메일, 재고 서비스의 존재를 명확히 알고, 직접 import해서 메소드를 호출합니다. 이게 바로 강한 결합입니다. 이 방식의 고통은 시스템이 변경될 때 찾아옵니다.

- EmailService의 메일 발송 메소드 이름이 바뀌면? OrderService도 고쳐야 합니다.
- "주문 완료 시 카카오톡 알림 발송" 기능이 추가되면? 또 OrderService를 찾아가 KakaoTalkService를 import하고 코드를 추가해야 합니다.

OrderService는 주문 처리라는 핵심 책임 외에 온갖 부가 기능까지 책임져야 하는 뚱뚱한 서비스(fat service)가 되어버리고, 변경에 매우 취약한 구조가 됩니다.

### 이벤트로 import 문 지우기

하지만 이 로직을 이벤트 방식으로 바꾸면, import 문이 마법처럼 사라집니다.

어떻게 그게 가능할까요? 바로 Spring이 제공하는 ApplicationEvent라는 개념 덕분입니다.

Spring은 내부 컴포넌트끼리 직접 호출 없이, 메시지를 던지듯 통신할 수 있는 이벤트 기반 구조를 제공합니다.

```
[주문 생성 서비스]
   └── (이벤트 발행) → [쿠폰 처리 서비스], [재고 처리 서비스] , [이메일 알림 서비스] …
```

이 구조의 중심에는 ApplicationEventPublisher라는 이벤트 발행자가 있습니다. 이 발행자를 통해 코드를 변경하면 아래와 같이 바뀝니다.

```java
// import com.example.coupon.CouponService;        // <-- 사라짐
// import com.example.notification.EmailService;  // <-- 사라짐
// import com.example.stock.StockService;         // <-- 사라짐

@Service
public class OrderService {
    private final ApplicationEventPublisher publisher; // 오직 '발행자'만 안다.

    public void place(...) {
        // 주문 처리 로직 ...
        publisher.publishEvent(new OrderEvent.Complete(...)); // "주문 완료됐다!" 방송만 한다.
    }
}
```

OrderService는 이제 다른 서비스들의 존재를 전혀 모릅니다. 이로써 하나의 사건이 여러 후속 조치를 유발할 때, 혹은 각 서비스의 독립적인 개발과 배포가 중요할 때 이벤트는 강력한 힘을 발휘하며, 시스템의 유연성과 확장성을 극적으로 높여줍니다.

## 느슨함에도 경계가 있다

그렇다고 모든 걸 이벤트로 분리하면 될까요? 아닙니다.

이벤트 적용 여부는 핵심 트랜잭션과 후속 트랜잭션을 어떻게 나누는가에 달려 있습니다.

- **핵심 트랜잭션** : 시스템의 데이터 정합성을 책임지는 , 반드시 원자적으로 성공해야 하는 핵심 로직입니다. 이 트랜잭션의 경계는 반드시 커밋이 보장되어야 합니다.
- **후속 트랜잭션** : 핵심 트랜잭션이 성공적으로 커밋된 이후에 실행되어도 괜찮은, 주로 부가적인 비즈니스 확장을 위한 로직입니다.

이 기준을 가지고 이벤트를 적용 할지 판단 해보겠습니다.

아래 주문 로직이 있습니다.

```java
// OrderFacade.java
@Transactional
public OrderResult.Create place(OrderCriteria orderCriteria) {
    // ...
    // 1. 쿠폰으로 할인 금액을 '계산'하고,
    // 2. 쿠폰 상태를 '사용됨'으로 변경
    Long discountAmount = couponService.getDiscountAmount(orderCriteria.getCouponId(), ...);
    // 3. 할인 금액을 포함하여 주문을 '생성'
    OrderCommand command = OrderCommandMapper.map(..., discountAmount);
    return OrderResult.Create.from(orderService.place(command));
}
```

언뜻 보면, 할인 금액을 계산하여 주문을 생성하고 해당 쿠폰을 '사용 처리'하는 것은 데이터 정합성을 위해 하나의 '핵심 트랜잭션'으로 묶는 것이 가장 안전하고 직관적인 방법입니다. 저 역시 처음에는 그렇게 생각했습니다.

하지만 여기서 한 걸음 더 나아가 **"주문 입장에서 정말로 궁금한 것이 무엇일까?"** 라고 질문을 던져볼 수 있습니다. <br/> 주문은 단순히 **'적용할 할인 금액'만 알면 되는 것 아닐까요?** 쿠폰의 상태를 변경하는 책임은 쿠폰 서비스가 알아서 처리해야 할 일일지도 모릅니다.
어쩌면 주문은 할인 금액만 알면 그만이고, 쿠폰의 상태를 변경하는 책임은 쿠폰 서비스가 알아서 처리해야 할 일일지도 모릅니다.

만약 "쿠폰 사용 후 알림 발송" 같은 기능이 추가된다면, 이벤트 기반 설계는 새로운 리스너만 추가하면 되지만 현재 구조는 주문 로직을 또 다시 수정해야 합니다. 결국 이것은 **'정답'이 없는 `설계적 '선택'** 의 문제입니다.

- **강한 정합성**을 최우선으로 하고 당장의 확장 계획이 없다면, 현재 코드처럼 하나의 트랜잭션으로 묶는 것이 합리적인 선택입니다.
- 반면, 각 서비스의 **독립성과 미래의 확장성**에 더 높은 가치를 둔다면, 약간의 복잡성을 감수하고 이벤트로 분리하는 설계를 고려할 수 있습니다.

이 고민을 통해 저는 후속 트랜잭션만 이벤트로 발행하는 것이 아니라, 때로는 핵심 트랜잭션의 일부처럼 보이는 로직도 설계 관점에 따라 이벤트로 분리할 수 있다는 유연한 시각을 갖게 되었습니다.

## 비대해진 서비스, 이벤트로 다이어트 시키기

반면, '포인트 결제' 로직은 고민의 여지가 없는, 이벤트를 도입하기에는 완벽한 후보였습니다.

```java
// PointPaymentProcessor.java
@Override
@Transactional
public void pay(PaymentProcessContext context) {
    // 1. 핵심 트랜잭션: 포인트 차감
    pointService.deduct(context.getUserId(), order.getFinalAmount());

    // --- 여기서부터 명백한 후속 트랜잭션들 ---
    // 2. 후속 처리 1: 결제 상태 '완료'로 변경
    // 3. 후속 처리 2: 상품 재고 차감
    // 4. 후속 처리 3: 주문 상태 '결제 완료'로 변경
}
```

PointPaymentProcessor의 본분은 '포인트 차감'이라는 명백한 핵심 트랜잭션입니다. 그 외의 작업들은 모두 포인트 차감이 성공한 후에 일어나는 후속 트랜잭션들이었죠. 이건 명백히 이벤트의 도움이 필요한 상황이었습니다

```java
// 개선된 PointPaymentProcessor.java
@Override
@Transactional
public void pay(PaymentProcessContext context) {
    // 1. 핵심 책임만 수행한다.
    pointService.deduct(context.getUserId(), ...);
    // 2. "결제 성공했다!"는 사실만 방송한다.
    applicationEventPublisher.publishEvent(PaymentEvent.Success.of(order.getId(), ...));
}
```

이제 PointPaymentProcessor는 군살을 싹 빼고 자신의 핵심 책임에만 집중하게 되었습니다. 나머지 후속 처리들은 각자 필요한 리스너들이 알아서 처리할 겁니다. 진정한 **`관심사의 분리`** 가 이루어진 순간이었습니다

## 이벤트와 트랜잭션, 진짜로 분리될까?

import 문을 제거하고 이벤트를 발행하니, **서비스 간의 결합도가 느슨해진 것** 이 눈에 보여 만족했습니다.

그런데 한 가지 궁금증이 남았습니다.

“코드는 분리된 것 같은데, **트랜잭션도 과연 분리된 걸까?** ”

이벤트를 발행했으니 구독자는 독립적으로 실행될 것 같기도 하고,
반대로 같은 흐름 안에서 함께 묶일 것 같기도 합니다.

즉, 이벤트 리스너는 발행자의 트랜잭션 안에서 동작하는 걸까요?
아니면 전혀 다른 트랜잭션으로 실행되는 걸까요?

이 궁금증을 확인하기 위해 테스트 환경을 하나 만들었습니다.
간단한 발행자 서비스와 구독자 서비스를 구성해,

`@EventListener`,
`@TransactionalEventListener(BEFORE_COMMIT)`,
`@TransactionalEventListener(AFTER_COMMIT)`

세 가지 경우를 비교해보기로 했습니다.

**`이벤트 발행자 (OuterService)`**

: 포인트를 충전하고(Point 저장), 충전 완료 이벤트를 발행하는 간단한 서비스입니다.

```java
@Service
@RequiredArgsConstructor
public class OuterService {
    private final PointRepository pointRepository;
    private final ApplicationEventPublisher applicationEventPublisher;

    @Transactional
    public void charge(Long userId, Long balance) {
        Point point = new Point(userId, balance);
        Point savedPoint = pointRepository.save(point);
        applicationEventPublisher.publishEvent(new OuterEvent(savedPoint.getId(), userId, balance));
    }
}
```

**`이벤트 구독자 (InnerService)`**

: 발행된 이벤트를 받아 포인트 변경 이력을 저장(PointHistory 저장)하고,
트랜잭션이 분리되어 있는지 확인하기 위해 일부러 예외를 발생시킵니다.

```java
@Service
@Slf4j
@RequiredArgsConstructor
public class InnerService {
    private final PointHistoryRepository pointHistoryRepository;

    @EventListener
    public void handle(OuterEvent event) {
        log.info("이벤트 컨슘: pointId={}", event.getPointId());
        pointHistoryRepository.save(new PointHistory("CREATE"));
        throw new IllegalArgumentException("에러 발생"); // 의도적으로 예외 발생
    }
}
```

이제 이 코드를 바탕으로, 리스너의 종류에 따라 트랜잭션이 어떻게 동작하는지 하나씩 살펴보겠습니다.

## @EventListener - 가장 기본적인 동기 처리

먼저 가장 단순한 **`@EventListener`** 를 사용했을 때입니다.

아래 테스트는 charge() 실행 시 `IllegalArgumentException`이 발생해야 하며, 예외가 발생했으므로 `pointRepository`에는 아무 데이터도 없어야 합니다 `(count=0)`

```java
@SpringBootTest
class EventListenerRollbackTest {

    @Autowired OuterService outerService;
    @Autowired PointRepository pointRepository;

    @Test
    @DisplayName("@EventListener 에서 예외 발생 시, 발행자의 트랜잭션도 롤백된다")
    void eventListener_throwsException_thenRollback() {
        // when & then
        assertThatThrownBy(() -> outerService.charge(1L, 1000L))
                .isInstanceOf(IllegalArgumentException.class);

        // then
        assertThat(pointRepository.count()).isZero();
    }
}
```

테스트는 예상대로 성공했습니다. <br/>
즉, **리스너에서 던진 예외가 발행자 트랜잭션까지 전파되어 전체가 롤백되었다**는 의미입니다.

이제 로그를 통해 구체적인 실행 흐름을 살펴보겠습니다.

```
// 1. OuterService.charge()를 위한 새로운 트랜잭션 생성
...jpaTransactionManager : Creating new transaction with name [...OuterService.charge]...
...TransactionInterceptor    : Getting transaction for [...OuterService.charge]

// 2. PointRepository.save() 실행 (아직 커밋 전)
DEBUG ... org.hibernate.SQL                 : insert into point (balance, user_id) values (?, ?)

// 3. InnerService.handle() 이벤트 리스너 실행
//    별도의 트랜잭션 로그 없이, 기존 트랜잭션에 참여하는 것을 볼 수 있음
...JpaTransactionManager : Participating in existing transaction
...InnerService   : 이벤트 컨슘1: pointId=1
DEBUG ... org.hibernate.SQL                 : insert into point_history (type) values (?)

// 4. InnerService에서 예외 발생 후, OuterService의 트랜잭션이 롤백됨!
...: Completing transaction for [...OuterService.charge] after exception: java.lang.IllegalArgumentException
...JpaTransactionManager : Initiating transaction rollback
...JpaTransactionManager : Rolling back JPA transaction on EntityManager [...]
```

publishEvent()가 호출되는 순간, @EventListener는 발행자와 동일한 스레드·트랜잭션 컨텍스트 안에서 즉시 실행되었습니다.

그 결과 `Participating in existing transaction` 로그가 찍혔고, InnerService에서 발생한 예외는 OuterService로 전파되어 전체 트랜잭션이 롤백된 것입니다.

## BEFORE_COMMIT - 커밋 직전의 감시자

다음은 커밋 직전에 동작하는 @TransactionalEventListener(phase = BEFORE_COMMIT)입니다. 리스너 코드만 살짝 변경하고, 동일한 테스트 코드를 실행했습니다.

```java
// InnerService.java
@TransactionalEventListener(phase = TransactionPhase.BEFORE_COMMIT)
public void handle(OuterEvent event) {
    log.info("이벤트 컨슘1: pointId={}", event.getPointId());
    pointHistoryRepository.save(new PointHistory("CREATE"));
    throw new IllegalArgumentException("에러 발생");
}

// 테스트 코드
@Test
@DisplayName("@TransactionalEventListener(BEFORE_COMMIT) 에서 예외 발생 시, 발행자의 트랜잭션도 롤백된다")
void beforeCommitListener_throwsException_thenRollback() {
    // when & then
    assertThatThrownBy(() -> outerService.charge(1L, 1000L))
            .isInstanceOf(IllegalArgumentException.class);

    // then
    assertThat(pointRepository.count()).isZero();
}
```

테스트는 예상대로 통과했습니다.
즉, BEFORE_COMMIT 리스너에서 발생한 예외 역시 발행자 트랜잭션을 롤백시킨 것입니다.

이제 로그를 통해 @EventListener와의 차이를 살펴보겠습니다

```
// 1. OuterService.charge()를 위한 새로운 트랜잭션 생성
...JpaTransactionManager : Creating new transaction with name [...OuterService.charge]...

// 2. PointRepository.save() 실행 (아직 커밋 전)
DEBUG ... org.hibernate.SQL                 : insert into point (balance, user_id) values (?, ?)

// 3. OuterService.charge() 메소드 종료 -> 트랜잭션 커밋 시도
...TransactionInterceptor    : Completing transaction for [...OuterService.charge]

// 4. '커밋 직전'에 이벤트 리스너 실행!
INFO  ... s.s.t.domain.inner.InnerService   : 이벤트 컨슘1: pointId=1
DEBUG ... org.hibernate.SQL                 : insert into point_history (type) values (?)

// 5. InnerService에서 예외 발생 후, '커밋 과정에서 예외가 발생'했으므로 롤백됨
..JpaTransactionManager : Initiating transaction rollback after commit exception
...JpaTransactionManager : Rolling back JPA transaction on EntityManager [...]
```

@EventListener와의 결정적인 차이는 실행 시점입니다. Completing transaction for [...OuterService.charge] 로그가 이벤트 컨슘 로그보다 먼저 찍혔습니다.

즉, 발행자 메소드의 모든 로직이 성공적으로 끝난 후, DB에 실제 커밋되기 직전 리스너가 실행된 것입니다.

하지만 여전히 발행자 트랜잭션의 경계 안에 있으므로, 리스너 예외는 최종 커밋을 막고 전체를 롤백시켰습니다.

### 실행 시점의 미학: @EventListener vs BEFORE_COMMIT

@EventListener와 BEFORE_COMMIT 둘 다 발행자의 트랜잭션을 롤백시키는데, 이 둘의 차이는 뭘까요? 언제 어떤 것을 선택해야 할까요?

차이는 실행 시점과 그 시점에서 보장되는 상태입니다.

```java
// @EventListener의 실행 흐름
[TX 시작] -> charge() 로직 1 -> save()
-> publishEvent() -> [**handle() 즉시 실행**]
-> charge() 로직 2 -> [TX 커밋/롤백]

// @TransactionalEventListener(BEFORE_COMMIT)의 실행 흐름
[TX 시작] -> charge() 로직 1 -> save()
-> publishEvent()
-> charge() 로직 2 -> [TX 커밋 시도] -> [**handle() 실행**] -> [실제 DB 커밋/롤백]
```

- **@EventListener**는 publishEvent()가 호출되는 즉시, 발행자 메소드의 로직 흐름 중간에 끼어들어 실행됩니다. 따라서 리스너가 실행되는 시점에는 발행자 메소드의 모든 로직이 끝났다는 보장이 없습니다.
- **@TransactionalEventListener(BEFORE_COMMIT)** 는 발행자 메소드가 모든 로직을 성공적으로 마치고, 트랜잭션 커밋을 시도하는 바로 그 직전에 실행됩니다. 즉, 리스너가 실행되는 시점에는 발행자 메소드의 모든 비즈니스 로직이 성공적으로 완료되었음이 보장됩니다.

### 언제 BEFORE_COMMIT을 쓸까?

솔직히 말해, BEFORE_COMMIT을 어떤 상황에 사용해야 할지 명확한 답을 내리기는 어려웠습니다

아마도 "주 트랜잭션의 모든 작업이 성공했음을 확인한 후, DB에 최종 커밋하기 직전에 마지막으로 무언가를 검증하고 싶을 때" 사용할 것 같습니다.

예를 들어, 모든 DB 작업이 끝난 후 외부 시스템에 최종 검증 쿼리를 보내고, 만약 실패 응답이 오면 예외를 발생시켜 전체 트랜잭션을 롤백시키는 시나리오 같은 경우 말입니다.

결론적으로, 대부분의 일반적인 동기 처리 상황에서는 `@EventListener`를 사용하는 것이 더 직관적일 것 같습니다. `BEFORE_COMMIT`은 주 트랜잭션의 성공을 전제로 한 마지막 동기화 작업이 필요한, 매우 특수한 경우를 위한 최후의 보루 같은 느낌이었습니다.

## AFTER_COMMIT - 진정한 트랜잭션의 분리

마지막은 @TransactionalEventListener(phase = AFTER_COMMIT) 입니다.

“드디어 발행자와 구독자의 트랜잭션을 완전히 분리할 수 있겠다”는 기대를 안고 리스너 코드를 수정했습니다.

```java
// InnerService.java
@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
public void handle(OuterEvent event) {
    log.info("이벤트 컨슘1: pointId={}", event.getPointId());
    pointHistoryRepository.save(new PointHistory("CREATE"));
    throw new IllegalArgumentException("에러 발생");
}
```

### 예외는 어디로 사라졌을까?

저는 이전과 동일하게 리스너에서 예외가 발생하면 발행자에게도 전파될 것이라 예상하고 다음과 같이 테스트 코드를 작성했습니다

```java
// 실패했던 최초의 테스트 코드
@Test
@DisplayName("AFTER_COMMIT 리스너에서 예외가 발생해도, 발행자는 커밋될 것이라 예상한다")
void afterCommitListener_throwsException_butPublisherIsCommitted() {
    // given & when & then
    // 리스너에서 발생한 예외가 여기까지 전파될 것이라 예상했지만...
    assertThatThrownBy(() -> outerService.charge(1L, 1000L))
            .isInstanceOf(IllegalArgumentException.class);

    // 리스너만 롤백되고, 발행자는 커밋되었을 테니 count는 1일 것이다.
    assertThat(pointRepository.count()).isEqualTo(1L);
}
```

그러나 결과는 예상과 달랐습니다.

> Expecting code to raise a throwable.

JUnit은 “예외가 발생하기를 기다렸지만 아무 일도 없었다”는 메시지를 출력했습니다.

로그를 확인해 보니 결정적인 단서를 발견했습니다:

> ERROR ... o.s.t.s.TransactionSynchronizationUtils : TransactionSynchronization.afterCompletion threw exception

즉, 트랜잭션이 이미 커밋 완료된 afterCompletion 시점에 예외가 발생했을 뿐, 발행자에게 전파될 방법은 없었던 겁니다.

### 이벤트 발행자는 이미 끝났다.

이 사실을 바탕으로 테스트를 수정했습니다.

발행자는 정상적으로 커밋되어야 하고, 데이터는 그대로 남아 있어야 합니다.

```java
// 성공한 최종 테스트 코드
@Test
@DisplayName("AFTER_COMMIT 리스너의 예외는 발행자에게 전파되지 않아 롤백시키지 않는다")
void afterCommitListener_exceptionDoesNotPropagate() {
    // when
    // 예외가 전파되지 않으므로, charge() 메소드는 정상 종료된다.
    outerService.charge(1L, 1000L);

    // then
    // 발행자의 트랜잭션은 성공적으로 커밋되었으므로, 데이터는 1건 존재해야 한다.
    assertThat(pointRepository.count()).isEqualTo(1L);
}
```

실행 결과는 예상대로 통과했습니다. 로그를 보면 이유가 더욱 분명합니다.

```
// 1. OuterService.charge()를 위한 트랜잭션 생성 및 실행
...

// 2. OuterService.charge()의 모든 로직이 끝나고, 트랜잭션 커밋!
TRACE ... o.s.t.i.TransactionInterceptor    : Completing transaction for [...OuterService.charge]
DEBUG ... o.s.orm.jpa.JpaTransactionManager : Initiating transaction commit
DEBUG ... o.s.orm.jpa.JpaTransactionManager : Committing JPA transaction on EntityManager [...]

// 3. --- 트랜잭션이 성공적으로 DB에 커밋된 후 ---
//    이제서야 리스너가 실행된다.
INFO  ... s.s.t.domain.inner.InnerService   : 이벤트 컨슘1: pointId=1

// 4. 리스너에서 예외가 발생했지만, 이미 트랜잭션은 끝났다.
...TransactionSynchronizationUtils  : TransactionSynchronization.afterCompletion threw exception
java.lang.IllegalArgumentException: 에러 발생
```

커밋 로그가 이벤트 로그보다 먼저 찍혔습니다.<br/>
즉, 발행자의 트랜잭션은 이미 종료된 상태에서 리스너가 실행된 것입니다.
따라서 리스너 예외는 단순히 로그에 남을 뿐, 발행자에게는 어떤 영향도 주지 못했습니다.

### 커밋 이후 리스너의 책임

`@TransactionalEventListener(phase = AFTER_COMMIT)` 은 발행자의 트랜잭션이 모두 끝난 뒤에 실행됩니다.

따라서 리스너에서 오류가 발생해도 이미 커밋된 발행자의 데이터는 절대 되돌릴 수 없습니다.

문제는 리스너가 처리하는 작업이 중요한 책임일 때입니다.
예를 들어 포인트 충전은 성공했지만, 충전 이력을 남기는 리스너가 계속 실패한다면?
그 데이터는 영영 누락될 수 있습니다.

따라서 `AFTER_COMMIT` 리스너는 실패하더라도 시스템 정합성에 큰 영향을 주지 않는 부가적인 작업에만 사용하는 것이 적절합니다.
알림 메일, SMS 발송, 로그 기록 같은 기능이 대표적입니다.

반대로 리스너의 작업이 반드시 성공해야 한다면, `재시도(Retry)` 나 `Dead Letter Queue(DLQ)` 같은 보상 처리 전략을 반드시 함께 고려해야 합니다.

## 맺으며

이벤트는 마법이 아닙니다. 하지만 올바른 맥락에서 사용하면 시스템의 복잡도를 줄이고, 확장성을 높이는 강력한 도구가 됩니다.  
**`커맨드`** 는 “해야 할 일”을, **`이벤트`** 는 “일어난 일”을 말합니다. 이 차이를 제대로 이해하는 순간, 우리는 서비스 간의 의존성을 설계하는 새로운 눈을 갖게 됩니다.

결국 중요한 건 기술이 아니라 **선택의 기준**입니다. 어떤 로직은 강하게 묶어야 하고, 어떤 로직은 과감히 분리해야 합니다.  
그 기준을 잡는 과정 속에서 이벤트는 단순한 기술을 넘어, 시스템을 어떻게 바라보고 확장할지를 결정하는 하나의 **철학**이 됩니다.
