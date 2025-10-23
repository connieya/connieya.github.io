---
date: '2024-03-15'
title: 'Spring @Transactional의 기본, REQUIRED 파헤치기'
categories: ['트랜잭션']
---

## TL;DR

- REQUIRED는 있으면 합류, 없으면 새로 시작합니다. 외부 TX가 있으면 내부는 한 몸이 되어 원자성이 보장됩니다.
- 내부에서 예외가 나면 TX는 rollback-only로 찍히고, 바깥에서 try-catch로 잡아도 최종 커밋 시 UnexpectedRollbackException이 발생합니다.
- 의도적 부분 커밋이 필요하면 noRollbackFor(원자성 해제) 또는 REQUIRES_NEW(독립 TX)로 명시하세요.

## 들어가며

트랜잭션은 원자성(Atomicity), 즉 'All or Nothing'을 보장합니다. 하나의 작업 단위로 묶인 모든 연산이 함께 성공하거나 함께 실패하는 이 강력한 원칙 덕분에, 우리는 데이터 정합성을 믿고 개발할 수 있습니다.

하지만 이 믿음은 때로 예상치 못한 결과를 낳기도 합니다. 현실의 코드는 수많은 @Transactional 어노테이션과 서비스 간의 연쇄 호출로 이루어져 있기 때문입니다. 예를 들어, 주문 처리 로직 안에서 재고를 감소시키고 포인트를 차감하는 것은 흔한 시나리오입니다.

이때 내부적으로 호출된 서비스의 트랜잭션은 어떻게 동작할까요? 독립적인 트랜잭션으로 처리될까요, 아니면 외부의 더 큰 트랜잭션의 일부가 될까요?

만약 두 서비스가 하나의 트랜잭션으로 묶인다면, 이들은 하나의 '운명 공동체'가 됩니다. 재고 차감은 성공했지만 포인트 차감에서 예외가 발생하면, 이미 성공한 재고 차감까지 모두 롤백되어 원자성이 보장됩니다. 반면, 만약 서로 다른 트랜잭션으로 동작한다면 재고는 커밋되고 포인트만 롤백되는 '부분 커밋' 상황이 발생하여 데이터 정합성이 깨질 수 있습니다.

이처럼 기존 트랜잭션에 합류할지, 새로 시작할지를 결정하는 규칙이 바로 **트랜잭션 전파(Transaction Propagation)** 입니다. 전파를 제대로 이해하지 못하면, 의도치 않은 롤백 범위와 데이터 불일치라는 함정에 빠지기 쉽습니다. 한번 어긋난 데이터는 시스템 규모가 클수록 추적하고 복구하기 매우 어렵습니다.

## 전파(Propagation) 7종 살펴보기

스프링은 다음과 같이 7가지의 트랜잭션 전파 속성을 제공합니다. <br/> 이번 글에서는 이 중에서 가장 기본이자 핵심인 `REQUIRED` 속성에 대해 집중적으로 알아보겠습니다.
| 전파 | 한 줄 정의 | 부모 TX 있음 | 부모 TX 없음 |
| :--------------- | :------------------------------ | :--------------------- | :----------------- |
| `REQUIRED` (기본) | 있으면 **합류**, 없으면 **새로 시작** | 합류 | 새 TX 시작 |
| `REQUIRES_NEW` | **항상 새 TX**로 실행, 부모는 **일시중단** | 부모 **suspend** 후 새 TX | 새 TX |
| `NESTED` | 부모 TX 안에서 **세이브포인트** 생성(부분 롤백) | 세이브포인트로 부분 롤백 | `REQUIRED`처럼 새 TX |
| `SUPPORTS` | 있으면 타고, 없으면 **비트랜잭션** | 합류 | TX 없이 실행 |
| `MANDATORY` | **부모 TX 필수** | 합류 | 예외 발생 |
| `NOT_SUPPORTED` | **항상 비트랜잭션**, 부모는 **일시중단** | 부모 **suspend** | TX 없이 실행 |
| `NEVER` | **TX 금지** | 예외 발생 | TX 없이 실행 |

### 전파를 ‘눈’으로 확인하기

트랜잭션 경계, 합류, 커밋, 롤백이 실제로 어떻게 동작하는지 로그로 직접 확인하는 것이 가장 확실한 방법입니다.

아래 설정을 application.yml에 추가하면 트랜잭션의 모든 동작을 한눈에 볼 수 있습니다.

```yml
logging:
  level:
    # Tx 경계/합류/롤백/서스펜드
    org.springframework.transaction.interceptor: TRACE
    org.springframework.orm.jpa.JpaTransactionManager: DEBUG

    # SQL + 바인딩 값 (Hibernate 6)
    org.hibernate.SQL: DEBUG
    org.hibernate.orm.jdbc.bind: TRACE

    # 선택: 상위 TM/풀/슬로우SQL
    org.springframework.transaction: DEBUG
    com.zaxxer.hikari: DEBUG
```

## REQUIRED — “있으면 타고, 없으면 내가 시작한다"

@Transactional의 기본 전파 속성은 `REQUIRED`입니다. 규칙은 매우 단순합니다.

- 부모 트랜잭션이 있으면 → 합류합니다.
- 없으면 → 새로운 트랜잭션을 시작합니다.

이 단순한 규칙이 어떻게 원자성을 보장하고, 또 때로는 어떻게 부분 커밋을 유발하는지 시나리오를 통해 알아보겠습니다.

## 테스트 시나리오

간단한 이커머스 시나리오를 바탕으로 트랜잭션 전파 속성을 테스트해 보겠습니다. 주문 시 재고 차감 후 포인트를 차감하는 순서로 로직이 진행됩니다. 트랜잭션 전파 속성 자체에 집중하기 위해 변수명이나 계층 구조 , 로직을 단순화했습니다.

```java
// 주문
@Service
@RequiredArgsConstructor
public class OrderService {
    private final StockService stockService;
    private final PointService pointService;

    @Transactional
    public void place(OrderCommand.Place cmd) {
        stockService.deduct(new StockCommand.Deduct(cmd.getItems()));
        pointService.deduct(new PointCommand.Deduct(cmd.getUserId(), cmd.getAmount()));
    }
    // ...
}

// 재고 차감
@Service
@RequiredArgsConstructor
public class StockService {
    private final StockRepository stockRepository;

    @Transactional
    public void deduct(StockCommand.Deduct deduct) {
        // ... 재고 차감 로직 ...
    }
}

// 포인트 차감
@Service
@RequiredArgsConstructor
public class PointService {
    private final PointRepository pointRepository;

    @Transactional
    public void deduct(PointCommand.Deduct pointCommand) {
        // ... 포인트 차감 로직 (잔액 부족 시 예외 발생) ...
    }
}

```

## 시나리오 1 : 외부 트랜잭션 있음 -> 모두 한 몸처럼 롤백

상황

- OrderService.place() 에 @Transactional 있음
- 포인트가 부족해 PointService.deduct() 에서 런타임 예외 발생

테스트 코드

```java
@Test
@DisplayName("REQUIRED: 외부 TX가 있으면 포인트 예외 시 전체 롤백")
void required_withOuterTx_rollsBackAll() {
    // given
    Stock stock = new Stock(1L, 10L);
    Stock savedStock = stockRepository.save(stock);

    Point point = new Point(1L, 1000L);
    Point savedPoint = pointRepository.save(point);


    // when
    assertThatThrownBy(() ->
        orderService.place(new OrderCommand.Place(List.of(new Item(1L, 5L)), 1L, 2000L))
    ).isInstanceOf(IllegalArgumentException.class);


     Point updatedPoint = pointRepository.findById(savedPoint.getId()).get();
     Stock updatedStock = stockRepository.findById(savedStock.getId()).get();

    // then: 모두 롤백
    assertThat(updatedPoint.getBalance()).isEqualTo(1000L);
    assertThat(updatedStock.getQuantity()).isEqualTo(10L);
}

```

테스트는 성공합니다. 로그를 통해 동작을 살펴보겠습니다.

### StockService.deduct는 기존 트랜잭션에 합류

```
Getting transaction for [...StockService.deduct]
Participating in existing transaction
```

Participating in existing transaction 메시지를 통해 OrderService가 만든 트랜잭션에 성공적으로 합류했음을 확인할 수 있습니다.

### PointService.deduct에서 예외 발생 및 rollback-only 마킹

```
Completing transaction for [...PointService.deduct] after exception: ...
Participating transaction failed - marking existing transaction as rollback-only
```

### OrderService.place 종료 시점에 전체 롤백

내부에서 예외가 발생했고 트랜잭션이 rollback-only로 표시되었기 때문에, 가장 바깥쪽 트랜잭션 경계인 OrderService가 종료되는 시점에 트랜잭션 매니저는 최종적으로 롤백을 실행합니다

```
Completing transaction for [OrderService.place] after exception: ...
Initiating transaction rollback
Rolling back JPA transaction on EntityManager [...]
```

`Initiating transaction rollback` 로그를 통해 트랜잭션 전체에 대한 롤백이 시작되었음을 명확히 알 수 있습니다.

이처럼 외부 트랜잭션이 있으므로 `StockService`와 `PointService`는 모두 `OrderService`가 시작한 트랜잭션에 합류했습니다. 그 결과, `PointService`에서 발생한 문제가 트랜잭션 '운명 공동체' 전체에 영향을 주었습니다. 이로 인해 성공적으로 수행된 것처럼 보였던 재고 차감 로직까지 함께 롤백되었습니다.

이것이 바로 `REQUIRED` 전파 속성이 데이터의 원자성을 보장하는 방식입니다.

## 시나리오 2 : try-catch 도 소용없는 rollback-only

앞선 실험에서 우리는 PointService에서 발생한 예외가 OrderService까지 전파되어 전체 트랜잭션을 롤백시키는 것을 확인했습니다.

그렇다면 이런 의문이 생길 수 있습니다.

"만약 OrderService에서 try-catch로 예외를 잡아서 정상 흐름처럼 처리하면, 재고 차감(StockService)은 커밋되지 않을까?"

직접 코드로 확인해 보겠습니다.

OrderService 수정

```java
@Transactional
public void placeWithTryCatch(OrderCommand.Place orderCommand) {
    stockService.deduct(new StockCommand.Deduct(orderCommand.getItems()));
    try {
          pointService.deduct(new PointCommand.Deduct(orderCommand.getUserId(), orderCommand.getAmount()));
    } catch (IllegalArgumentException e) {
         log.error(e.getMessage());
        }
    }
```

try-catch로 예외를 제어하려는 시도

상황

- OrderService.placeWithTryCatch()는 @Transactional이 선언되어 있습니다. (외부 트랜잭션 시작)
- 내부적으로 stockService.deduct()를 호출합니다. (기존 트랜잭션에 합류)
- pointService.deduct()를 호출하고, 여기서 발생하는 예외를 try-catch로 잡습니다.

테스트 코드

```java
@Test
@DisplayName("REQUIRED: 내부 예외를 catch하면 재고는 커밋될 것이라 예상하는 테스트")
void required_withCatch_expectCommit() {
    // given
    Stock stock = new Stock(1L, 10L);
    stockRepository.save(stock);
    Point point = new Point(1L, 1000L);
    pointRepository.save(point);

    // when
    // 예외가 발생하지 않을 것이므로, 그냥 메서드를 호출한다.
    orderService.placeWithTryCatch(new OrderCommand.Place(List.of(new Item(1L, 5L)), 1L, 2000L));

    // then
    Stock updatedStock = stockRepository.findById(1L).get();
    Point updatedPoint = pointRepository.findById(1L).get();

    // 재고는 5로 줄고, 포인트는 그대로 1000이길 기대한다.
    assertThat(updatedStock.getQuantity()).isEqualTo(5L); // <--- 이 검증은 실패할 것이다!
    assertThat(updatedPoint.getBalance()).isEqualTo(1000L);
}
```

### 예상치 못한 결과: UnexpectedRollbackException

하지만 위 테스트를 실행하면, then 검증 구문에 도달하기도 전에 테스트는 실패하며 콘솔에 낯선 예외가 출력됩니다.

![alt text](/images/transactional/unexpectedRollbackException.png)

try-catch로 분명히 예외를 잡았는데, 왜 뜬금없이 롤백 관련 예외가 발생하는 것일까요? 바로 여기에 REQUIRED 전파의 핵심 동작 방식인 **rollback-only**가 숨어있습니다

rollback-only 란?

> 하나의 물리적인 트랜잭션에 여러 메서드가 참여(REQUIRED)하고 있을 때, 그중 하나라도 롤백되어야 하는 상황이 발생하면 스프링은 현재 트랜잭션에 **"이 트랜잭션은 결국 롤백되어야만 합니다"** 라는 낙인, 즉 rollback-only 플래그를 찍습니다.

이 낙인은 한번 찍히면 절대 지워지지 않으며, 트랜잭션에 참여한 모든 구성원에게 전파됩니다.

로그를 통해 이 과정을 따라가 보겠습니다.

### PointService에서 예외 발생 및 rollback-only 마킹:

```
Completing transaction for [PointService.deduct] after exception: ...
Participating transaction failed - marking existing transaction as rollback-only // 바로 이 순간!
```

`PointService.deduct()`에서 예외가 발생하자마자, PointService를 감싸고 있던 트랜잭션 인터셉터는 예외를 잡고 자신이 참여한 물리 트랜잭션에 `rollback-only` 플래그를 세팅합니다. 그리고 나서 잡았던 예외를 다시 밖으로 던집니다.

### OrderService에서 예외 catch:

OrderService의 try-catch 블록은 PointService가 던진 예외를 성공적으로 잡아냅니다. 그래서 placeWithTryCatch 메서드 자체는 아무 문제 없이 정상적으로 종료됩니다.

### OrderService 트랜잭션 커밋 시도:

가장 바깥쪽 트랜잭션 경계인 placeWithTryCatch 메서드가 종료되고, 스프링의 트랜잭션 매니저는 이제 트랜잭션을 커밋하려고 합니다.

### rollback-only 플래그 발견 및 강제 롤백:

바로 이때, 트랜잭션 매니저는 커밋을 시도하기 전에 트랜잭션의 상태를 확인하고, rollback-only 낙인이 찍혀있는 것을 발견합니다.

- 개발자 코드: 정상 종료되었으니 커밋을 원함
- 트랜잭션 상태: rollback-only이므로 롤백되어야 함

이처럼 개발자의 의도와 트랜잭션의 실제 상태가 불일치하는 상황을 명확하게 알리기 위해, 스프링은 **UnexpectedRollbackException** 을 던지는 것입니다.

"너의 코드는 정상 종료됐지만, 트랜잭션은 이미 롤백되도록 운명이 정해져 있어서 어쩔 수 없이 롤백했어!"라고 알려주는 친절한 경고인 셈입니다.

### 올바른 테스트와 검증

이제 이 동작을 정확히 이해했으니, 테스트 코드를 올바르게 수정할 수 있습니다. placeWithTryCatch 호출하면 최종적으로 UnexpectedRollbackException이 발생하고, 모든 데이터 변경 사항은 롤백될 것임을 검증해야 합니다.

```java
@Test
@DisplayName("REQUIRED: 내부 예외를 catch해도 rollback-only 때문에 전체 롤백된다")
void required_withCatch_rollsBackAll_dueToRollbackOnly() {
    // given
    Stock stock = new Stock(1L, 10L);
    stockRepository.save(stock);
    Point point = new Point(1L, 1000L);
    pointRepository.save(point);

    // when & then
    // placeWithTryCatch 호출 시 UnexpectedRollbackException이 발생하는 것을 검증
    assertThatThrownBy(() ->
        orderService.placeWithTryCatch(new OrderCommand.Place(List.of(new Item(1L, 5L)), 1L, 2000L))
    ).isInstanceOf(UnexpectedRollbackException.class);

    // then: 모든 것이 롤백되었는지 최종 확인
    Stock updatedStock = stockRepository.findById(1L).get();
    Point updatedPoint = pointRepository.findById(1L).get();

    // 재고와 포인트 모두 초기 상태 그대로여야 한다.
    assertThat(updatedStock.getQuantity()).isEqualTo(10L);
    assertThat(updatedPoint.getBalance()).isEqualTo(1000L);
}
```

이 테스트는 성공합니다. 이를 통해 우리는 REQUIRED 전파 환경에서 try-catch는 예외의 흐름을 제어할 뿐, 한번 찍힌 rollback-only 낙인을 무효화할 수는 없다는 중요한 사실을 배울 수 있습니다.

## 시나리오 3 : noRollbackFor로 롤백 정책 직접 제어하기

그렇다면 '예외는 발생했지만, 전체 작업을 롤백하고 싶지는 않은' 경우는 어떻게 처리해야 할까요? 이럴 때 사용하는 것이 바로 @Transactional의 noRollbackFor 속성입니다.

noRollbackFor는 특정 예외가 발생하더라도 트랜잭션을 rollback-only로 마킹하지 말라고 스프링에게 알려주는 기능입니다.

상황

- PointService.deduct 메서드의 @Transactional에 **noRollbackFor = IllegalArgumentException.class**를 추가합니다.
- OrderService에서는 이전과 동일하게 try-catch로 IllegalArgumentException을 잡습니다.

PointService 수정

```java
 @Transactional(noRollbackFor = IllegalArgumentException.class)
 public void deductWithNoRollbackFor(PointCommand.Deduct pointCommand) {
      Point point = pointRepository.findByUserId(pointCommand.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("포인트가 없습니다."));

      point.deduct(pointCommand.getBalance());

    }
```

OrderService 수정

```java
@Transactional
public void placeWithTryCatch(OrderCommand.Place orderCommand) {
    stockService.deduct(new StockCommand.Deduct(orderCommand.getItems()));
    try {
         pointService.deductWithNoRollbackFor(new PointCommand.Deduct(orderCommand.getUserId(), orderCommand.getAmount()));
    } catch (IllegalArgumentException e) {
            log.error(e.getMessage());
    }
}
```

테스트 코드

이제 우리의 시나리오대로라면, placeWithTryCatch 예외 없이 정상 종료되고, 재고 차감(StockService)은 커밋되어야 합니다.

```java
@Test
@DisplayName("noRollbackFor: 내부 예외를 catch하면 재고 차감은 정상 커밋된다")
void noRollbackFor_withCatch_commitsPartial() {
        // given
        Stock stock = new Stock(1L, 10L);
        Stock savedStock = stockRepository.save(stock);

        Point point = new Point(1L, 1000L);
        Point savedPoint = pointRepository.save(point);

        // when
        orderService.placeWithTryCatch(new OrderCommand.Place(List.of(new Item(1L, 5L)), 1L, 2000L));

        Point updatedPoint = pointRepository.findById(savedPoint.getId()).get();
        Stock updatedStock = stockRepository.findById(savedStock.getId()).get();

        // then
        assertThat(updatedPoint.getBalance()).isEqualTo(1000L);
        assertThat(updatedStock.getQuantity()).isEqualTo(5L);


}
```

이 테스트는 성공합니다! 드디어 우리가 의도한 대로 부분 커밋을 제어할 수 있게 되었습니다.

로그로 확인하는 동작 원리

이전과 로그를 비교해 보면 결정적인 차이를 발견할 수 있습니다.

### PointService.deduct에서 예외 발생 → rollback-only 마킹 안 함!

```
// PointService.deduct() 진입
Getting transaction for [PointService.deduct]
Found thread-bound EntityManager [...] for JPA transaction
Participating in existing transaction

// 예외 발생 후
Completing transaction for [PointService...] after exception: IllegalArgumentException: 포인트가 부족합니다.
// *** 이전과 달리 'marking existing transaction as rollback-only' 로그가 없다! ***
```

noRollbackFor 설정 때문에, IllegalArgumentException이 발생했음에도 불구하고 트랜잭션 인터셉터는 트랜잭션을 rollback-only로 마킹하지 않고 그냥 예외만 던집니다.

### OrderService에서 커밋 성공

OrderService가 예외를 catch하고 메서드가 정상적으로 종료된 후, 트랜잭션 매니저가 커밋을 시도합니다.

```
// OrderService.placeWithTryCatch() 메서드가 정상 종료된 후
Completing transaction for [OrderService.placeWithTryCatch]
// rollback-only 플래그가 없으므로, 커밋을 진행한다.
Initiating transaction commit
Committing JPA transaction on EntityManager [...]
```

rollback-only 낙인이 없으므로 트랜잭션 매니저는 아무런 방해 없이 커밋을 진행합니다. 이 시점까지 트랜잭션 내에서 성공적으로 수행된 모든 작업(즉, stockService.deduct())이 DB에 반영됩니다.

### noRollbackFor 사용 시 주의사항

noRollbackFor는 강력한 기능이지만, 신중하게 사용해야 합니다.

- 데이터 정합성: 이 기능을 사용한다는 것은 의도적으로 원자성을 깨고 부분 커밋을 허용하겠다는 의미입니다. 재고는 차감됐는데 주문은 실패하는 등의 시나리오가 발생하지 않도록 비즈니스 로직을 매우 신중하게 설계해야 합니다.
- 예외의 성격: NullPointerException이나 DataAccessException과 같이 시스템이 불안정하거나 데이터 접근에 문제가 생긴 예외에 대해서는 noRollbackFor를 사용해서는 안 됩니다. 비즈니스적으로 예측 가능하고, 후속 처리가 가능한 예외(예: InsufficientBalanceException)에 대해서만 제한적으로 사용하는 것이 좋습니다.

이렇게 rollbackFor/noRollbackFor 속성을 활용하면, 단순한 성공/실패를 넘어 훨씬 더 정교하고 유연한 트랜잭션 제어가 가능해집니다.

## 시나리오 4 : 외부 트랜잭션 없음 → 의도치 않은 부분 커밋 발생

마지막으로, OrderService의 @Transactional을 제거하면 어떻게 될까요?

- OrderService.placeNoTx()로 호출하면, 외부 트랜잭션이 없는 상태에서 시작합니다.
- StockService.deduct()는 부모 트랜잭션이 없으므로 REQUIRED 정책에 따라 새로운 트랜잭션(TX1)을 시작합니다. 로직 수행 후 TX1을 커밋합니다.
- PointService.deduct() 역시 부모 트랜잭션이 없으므로 또 다른 새로운 트랜잭션(TX2)을 시작합니다. 로직 수행 중 예외가 발생하여 TX2는 롤백됩니다.

결과적으로 재고 차감은 커밋되고, 포인트 차감은 롤백되는 부분 커밋이 발생하여 데이터 정합성이 깨지게 됩니다. 이는 트랜잭션 전파에 대한 이해 없이 @Transactional을 남용했을 때 발생할 수 있는 대표적인 문제입니다.

## REQUIRES_NEW는 어떨까?

부분 커밋을 허용할 것이라면 `REQUIRED_NEW` 가 낫지 않을까?

noRollbackFor 과 REQUIRED_NEW 의 차이는 무엇일까?

한 줄 비교

- noRollbackFor : 같은 물리 TX 내에서 특정 예외에 대해 rollback-only 마킹을 막아 부분 커밋을 허용합니다.
- REQUIRES_NEW : 부모 TX를 **일시중단(suspend)** 하고 완전히 새로운 물리 TX로 실행합니다. 부분 커밋/롤백 경계를 더 명확히 관리할 수 있습니다

`REQUIRES_NEW` 에 대한 더 자세한 내용은 다음 시리즈에서 깊이 있게 다루어 보겠습니다.

## 맺으며

지금까지 @Transactional의 기본 전파 전략인 REQUIRED에 대해 깊이 있게 알아보았습니다.

### 요약

- REQUIRED는 호출하는 쪽에 진행 중인 트랜잭션이 있으면 참여하고, 없으면 새로운 트랜잭션을 시작합니다.
- 이 특징 때문에 서비스의 가장 바깥 계층에 @Transactional을 선언하면, 그 안에서 호출되는 다른 서비스들은 하나의 거대한 트랜잭션으로 묶여 원자성을 보장받을 수 있습니다.
- 하지만 트랜잭션 내에서 발생한 RuntimeException은 트랜잭션을 rollback-only로 마킹하며, 이는 try-catch로도 막을 수 없는 강력한 전파력을 가집니다.
- 이런 롤백 정책을 제어하고 싶을 때는 noRollbackFor 와 같은 속성을 사용해 명시적으로 처리해야 합니다.
- 반대로, 가장 바깥 계층에 트랜잭션이 없으면 각 서비스가 개별 트랜잭션을 생성하여 의도치 않은 부분 커밋을 유발할 수 있음을 항상 명심해야 합니다.
