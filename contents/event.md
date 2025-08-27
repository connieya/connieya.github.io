---
date: '2025-08-29'
title: '애플리케이션 이벤트'
categories: ['application event']
---


## "정말 동기일까? " - @EventListener 에 예외를 던져보자


```java
@Service
@Slf4j
public class InnerService {
    @EventListener
    public void handle(OuterEvent event) {
        log.info("이벤트 컨슘: pointId={}", event.pointId());
        throw new IllegalArgumentException("에러 발생");
    }
}
```

테스트 코드 작성

```java
@Test
@DisplayName("@EventListener 동기 리스너 예외는 호출자까지 전파되어 발행 트랜잭션이 롤백된다")
void eventListener_exception_propagates_and_rollbacks_caller() {
    assertThatThrownBy(() -> outerService.charge(1L, 1000L))
            .isInstanceOf(IllegalArgumentException.class);

    assertThat(pointRepository.count()).isZero();
}
```


콘솔에 로그를 보면


```
... Completing transaction for OuterService.charge after exception: IllegalArgumentException
... Participating transaction failed - marking existing transaction as rollback-only
```


## "커밋 직전에 실행하면?" - @TransactionalEventListener(BEFORE_COMMIT)

```java
@Service
@Slf4j
public class InnerService {
    @TransactionalEventListener(phase = TransactionPhase.BEFORE_COMMIT)
    public void handle(OuterEvent event) {
        log.info("이벤트 컨슘: pointId={}", event.pointId());
        throw new IllegalArgumentException("에러 발생");
    }
}
```


테스트 코드

```java
@Test
@DisplayName("BEFORE_COMMIT에서 예외가 나면 커밋이 막히고 발행 트랜잭션은 롤백된다")
void beforeCommit_exception_blocks_commit_and_rollbacks() {
    assertThatThrownBy(() -> outerService.charge(1L, 1000L))
            .isInstanceOf(IllegalArgumentException.class);

    assertThat(pointRepository.count()).isZero();
}
```

로그를 보면


```
... Registered transaction synchronization for PayloadApplicationEvent
... triggerBeforeCommit(...)
... Initiating transaction rollback after commit exception
```

