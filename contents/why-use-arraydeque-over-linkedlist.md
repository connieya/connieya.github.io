---
date: '2024-08-14'
title: 'Java Queue: LinkedList보다 ArrayDeque를 권장하는 이유'
categories: ['java', 'data-structure']
deploy: true
---

코딩 테스트 준비를 위해 '자바 알고리즘 인터뷰'라는 책으로 공부하던 중이었습니다.
Deque 자료구조에 대한 설명을 읽던 중 흥미로운 내용을 발견했습니다.

> "ArrayDeque는 스택과 큐를 대체하는 역할을 하는 매우 중요한 자료형이다."

사실 저는 `ArrayDeque`라는 존재를 이번에 처음 알게 되었습니다.
보통 Queue가 필요하면 관성적으로 `new LinkedList<>()`를 사용해왔기 때문입니다.

궁금해서 찾아보니 `LinkedList`와 `ArrayDeque` 모두 삽입(offer)과 추출(poll)의 시간 복잡도가 **O(1)** 로 동일했습니다.

'어라? 시간 복잡도가 똑같은데 왜 굳이 ArrayDeque를 추천하는 거지?'
'혹시 공간 복잡도와 관련이 있나? 아니면 내가 모르는 치명적인 단점이 있나?'

단순히 "좋다니까 써야지" 하고 넘어가기에는 개발자로서의 호기심이 발동했습니다.
그래서 이참에 두 녀석의 동작 원리를 제대로 파헤쳐 보기로 했습니다.

## 두 클래스의 배경

먼저 두 클래스가 언제, 어떤 목적으로 만들어졌는지 살펴보았습니다.

- **LinkedList**: Java 1.2 (1998)
- **ArrayDeque**: Java 1.6 (2006)

LinkedList는 Java 1.2에서 Collections Framework와 함께 등장했습니다. `List`, `Queue`, `Deque` 인터페이스를 모두 구현하는 범용 클래스로, 하나의 클래스가 여러 역할을 겸하도록 설계되었습니다.

ArrayDeque는 약 8년 뒤 Java 1.6에서 추가되었습니다. `Deque` 인터페이스만을 구현하며, 큐와 스택 용도에 특화된 클래스입니다. 실제로 ArrayDeque의 구현자가 Joshua Bloch 본인인데, 그가 직접 "LinkedList보다 거의 모든 면에서 낫다"고 언급한 바 있습니다.

정리하면, LinkedList는 범용으로 만들어진 클래스이고, ArrayDeque는 큐/스택 용도로 성능을 집중한 클래스입니다.

## LinkedList의 동작 원리

우리가 흔히 쓰는 LinkedList는 **이중 연결 리스트(Doubly Linked List)** 구조입니다.
데이터를 추가하고 삭제할 때 내부적으로 어떤 일이 일어나는지 시각적으로 살펴보겠습니다.

### 추가 (offer)

새로운 데이터를 추가하려면, 힙(Heap) 메모리에 새로운 **노드 객체**를 할당하고, 이전 노드와 참조(주소)를 연결해야 합니다.

```text
[Node A] <-> [Node B] <-> [Node C]   (tail)
                                       |
                                       V
[Node A] <-> [Node B] <-> [Node C] <-> [New Node] (tail)
```

1. `New Node` 객체 생성 (메모리 할당 비용 발생)
2. 기존 `tail`(Node C)의 `next`를 `New Node`로 설정
3. `New Node`의 `prev`를 기존 `tail`로 설정
4. `tail` 포인터를 `New Node`로 이동

### 제거 (poll)

```text
(head)
[Node A] <-> [Node B] <-> [Node C]
   |
   V
(head)      (GC 대상)
[Node B] <-> [Node C] ... [Node A]는 연결 끊김
```

1. `head`가 가리키던 `Node A`의 데이터를 반환용으로 저장
2. `head`를 `Node A`의 `next`인 `Node B`로 이동
3. `Node A`는 더 이상 참조되지 않으므로 나중에 **Garbage Collector**가 수거

매번 객체를 만들고, 참조를 연결하고, 끊어진 객체를 GC가 수거하는 과정이 반복됩니다.

## ArrayDeque의 동작 원리

반면 ArrayDeque는 내부적으로 **배열(Array)** 을 사용하며, `head`와 `tail`이라는 인덱스만 관리합니다.

### 초기 상태 & 추가 (offer)

```text
배열 길이 4: [ A ] [ B ] [ C ] [ _ ]
               ^               ^
              head            tail
```

- `head`: 0 (A가 있는 위치)
- `tail`: 3 (다음에 데이터가 들어갈 빈 공간)

여기서 데이터를 추가하면 `tail` 위치에 값을 넣고, `tail`을 한 칸 이동시킵니다. **새로운 객체 할당이 없습니다.**

### 제거 (poll)

```text
poll() 호출 -> A 반환

배열 길이 4: [ _ ] [ B ] [ C ] [ _ ]
                    ^           ^
                   head        tail
```

- `head`가 0에서 1로 이동했습니다.
- **중요한 점**: 배열의 데이터를 앞으로 당기지 않습니다! 단순히 `head` 인덱스만 이동합니다.

### 원형 버퍼 (Circular Buffer)

그런데 위 상태에서 계속 offer/poll을 반복하면, `head`와 `tail`이 오른쪽으로만 이동하면서 왼쪽 공간이 낭비될 것 같습니다. ArrayDeque는 이 문제를 **원형 버퍼** 방식으로 해결합니다.

`tail`이 배열 끝에 도달하면 인덱스 0으로 되돌아갑니다. 내부적으로는 `(tail + 1) % length`로 다음 위치를 계산합니다.

```text
1) 현재 상태 (tail이 배열 끝)
[ _ ] [ B ] [ C ] [ D ]
        ^               ^
       head            tail

2) offer(E) -> tail이 인덱스 0으로 순환
[ E ] [ B ] [ C ] [ D ]
  ^     ^
 tail  head
```

배열의 끝과 시작이 논리적으로 이어진 원형 구조이기 때문에, 빈 공간이 있는 한 새 배열을 만들 필요가 없습니다.

### 공간이 부족할 때 (Resize)

만약 `head`와 `tail`이 만나서 빈 공간이 없다면, 기존 배열보다 2배 큰 배열을 생성하고 데이터를 순서대로 복사합니다.

```text
[Resize 전] (꽉 참 - head와 tail이 겹침)
[ E ] [ B ] [ C ] [ D ]
  ^
head/tail (겹침)

      |
      V

[Resize 후] (2배 확장)
[ B ] [ C ] [ D ] [ E ] [ _ ] [ _ ] [ _ ] [ _ ]
  ^                       ^
 head(0)                 tail(4)
```

이 Resize 과정이 부담스러울 것 같지만, 배열 크기가 2배씩 늘어나므로 자주 일어나지 않습니다(Amortized O(1)). 매번 노드를 생성하는 LinkedList보다 훨씬 효율적입니다.

## 왜 ArrayDeque가 더 빠른가?

앞서 살펴본 두 자료구조의 동작 원리를 비교해보면, 왜 ArrayDeque가 더 효율적인지 명확해집니다.

이론적으로(Big-O) 두 자료구조 모두 추가/제거는 **O(1)** 입니다. 하지만 실제 하드웨어 레벨에서는 큰 차이가 있습니다.

### 캐시 지역성 (Cache Locality)

CPU는 메모리에서 데이터를 가져올 때, 주변 데이터도 함께 캐시(Cache)로 가져옵니다.

- **ArrayDeque**: 데이터가 배열에 연속적으로 저장되어 있습니다. 따라서 다음 데이터를 읽을 때 이미 캐시에 올라와 있을 확률이 높습니다(Cache Hit).
- **LinkedList**: 노드들이 메모리 곳곳에 흩어져 있습니다. 다음 노드를 찾으려면 매번 메모리의 다른 주소를 참조해야 하므로, 캐시 효율이 떨어집니다(Cache Miss).

### 메모리 오버헤드와 GC

- **LinkedList**: 데이터를 저장할 때마다 `Node` 객체를 새로 생성해야 합니다. 데이터 외에도 주소값(prev, next)을 저장해야 하므로 메모리를 더 많이 씁니다. 또한 생성된 수많은 노드 객체는 나중에 GC(Garbage Collector)의 처리 대상이 됩니다.
- **ArrayDeque**: 배열 하나만 관리하면 됩니다. 데이터가 늘어나면 가끔 Resize만 하면 되므로, 매번 객체를 생성하고 수거하는 비용이 없습니다.

### 실제로 얼마나 차이 나는가?

이론만으로는 와닿지 않으니, offer/poll을 10만 회 반복하는 간단한 벤치마크를 돌려보았습니다.

```java
Queue<Integer> queue = new ArrayDeque<>(); // 또는 new LinkedList<>()
for (int i = 0; i < 100_000; i++) {
    queue.offer(i);
}
for (int i = 0; i < 100_000; i++) {
    queue.poll();
}
```

JVM 워밍업 5회 후 10회 측정한 평균 결과입니다.

|                | 평균 시간 |
| -------------- | --------- |
| **ArrayDeque** | 0.53 ms   |
| **LinkedList** | 0.97 ms   |

순수 큐 연산만 비교하면 ArrayDeque가 약 **45% 빠릅니다.**

다만 실제 알고리즘 문제(BFS 등)에서는 I/O, 객체 생성 등 큐 외의 비용이 전체 시간의 대부분을 차지하기 때문에, 체감 차이는 이보다 작을 수 있습니다.

## ArrayDeque의 제약: null을 허용하지 않는다

ArrayDeque는 `null` 값을 저장할 수 없습니다. `offer(null)`을 호출하면 `NullPointerException`이 발생합니다.

이유는 단순합니다. `poll()`은 큐가 비어있을 때 `null`을 반환하는데, 만약 `null`이 저장되어 있다면 "큐가 비어서 null을 반환한 건지, 저장된 null을 꺼낸 건지" 구분할 수 없기 때문입니다. LinkedList는 `null` 저장이 가능하므로, 이 모호함이 실제로 발생할 수 있습니다.

`null`을 큐에 넣을 일은 거의 없지만, 만약 기존 코드에서 LinkedList에 `null`을 넣고 있었다면 ArrayDeque로 바꿀 때 주의가 필요합니다.

## 결론: 무엇을 써야 할까?

결론은 명확합니다.

- **Queue, Deque, Stack**이 필요하다면? -> `ArrayDeque`
- **LinkedList**는 언제 쓰나? -> `Iterator`로 순회하면서 중간 삽입/삭제를 해야 할 때. 단, 인덱스로 위치를 찾아서 삽입하는 경우는 탐색이 O(n)이므로 `ArrayList`와 큰 차이가 없습니다.

저도 이번에 정리하면서 `new LinkedList<>()`를 습관적으로 쓸 이유가 없다는 걸 알게 됐고, 그 뒤로는 `new ArrayDeque<>()`를 쓰고 있습니다.
