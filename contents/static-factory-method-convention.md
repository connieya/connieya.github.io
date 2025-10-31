---
date: '2024-10-17'
title: '정적 팩토리 메서드, 취향에서 컨벤션으로'
categories: ['리팩토링']
deploy: true
---

## Setter 기반 객체 생성의 한계

회사 프로젝트 코드를 보다 보면 유지보수가 쉽지 않은 부분이 눈에 띄곤 합니다. 새로운 기능을 추가하기 전에 코드를 분석하다 보면 “이 부분은 지금 방식보다 더 나은 방법이 있지 않을까?”라는 생각이 들 때가 있습니다. 가능하다면 작은 개선부터 시도해 두는 편이 이후 유지보수에 도움이 된다고 믿습니다.

다행히 회사에서는 이런 시도를 긍정적으로 봐주고, 대표님과 동료들도 개선 작업에 힘을 실어주십니다. 다만 단순히 "코드를 다듬었다"는 이유만으로는 충분하지 않기 때문에, 왜 바꿔야 하는지, 어떤 장점이 있는지 근거를 항상 설명해야 했습니다. 같은 질문이 반복될 때가 많아 글로 정리해두고 링크를 공유하는 것이 더 효율적이겠다고 생각했습니다.

현재 회사 여러 프로잭트 코드에서 가장 자주 보이는 패턴 중 하나는 **기본 생성자로 객체를 만든 뒤 setter로 값을 주입하는 방식**입니다. 예를 들어 TerminalAuthResponse 같은 DTO를 다룰 때 이런 코드가 흔합니다.

```java
response.setResponseCode(TerminalResponseCode.APPROVED);
response.setApprovalCode(...);     // 승인 코드 생성
response.setCardReferenceId(...);  // 카드 참조 ID 세팅
```

겉보기에 단순해 보이지만, 유지보수 관점에서 여러 가지 문제가 있습니다.

### 객체가 불완전한 상태로 존재할 수 있음

- 객체를 new로 만든 직후에는 아직 필수 값이 세팅되지 않은 상태입니다.
- 만약 중간에 setter 호출이 누락되면 불완전한 객체가 그대로 다른 메서드로 넘어갈 수 있습니다.

### 불변성을 지키기 어려움

- setter는 외부에서 언제든 호출될 수 있으므로, 객체가 만들어진 뒤에도 값이 바뀔 위험이 있습니다.
- 디버깅할 때 “도대체 어디서 값이 바뀌었지?”라는 문제로 이어질 수 있습니다.

### 코드 라인이 불필요하게 늘어남

- 객체 하나를 만들기 위해 `new → set → set → … ` 과정을 반복해야 합니다.
- 필드가 많아질수록 코드가 장황해지고, 의도가 잘 드러나지 않습니다.

### 코드를 읽는 사람이 의도를 파악하기 어려움

- `response.setResponseCode(APPROVED)`라는 한 줄만 봐서는, 이것이 단순히 필드 값을 바꾸는 것인지, 아니면 “승인된 응답 객체를 생성하는 맥락”인지 알기 어렵습니다.
- 결국 클래스 정의를 열어보거나 다른 로직을 추적해야 해서 유지보수 부담이 커집니다.

이런 이유들 때문에 저는 setter 방식보다 더 명확하고 안전한 객체 생성 방법이 필요하다고 생각했습니다.

## 정적 팩토리 메서드 도입

이 문제를 해결하기 위해 생성자와 빌더를 고민했습니다. 생성자는 안전하지만 파라미터가 늘어지면 의도가 보이지 않고, 빌더는 가독성이 좋지만 코드가 장황해집니다.

결국 제가 선택한 건 **정적 팩토리 메서드**였습니다. 가장 큰 이유는 단순합니다. **이름을 가질 수 있다**는 점이 매력적이었습니다.

예를 들어 승인 응답을 만들 때, 다음과 같이 작성할 수 있습니다.

```java
TerminalAuthResponse response = TerminalAuthResponse.approved(cardReferenceId, approvalCode);
```

이 코드만 보아도 “승인된 응답을 만들고 있구나”라는 의도가 분명히 드러납니다. 생성자나 빌더만으로는 담기 어려운 맥락을 메서드 이름으로 표현할 수 있다는 점에서 큰 가치를 느꼈습니다.

## 정적 팩토리 메서드의 다양한 장점

제가 처음에는 “이름을 가질 수 있다”는 이유 하나로 정적 팩토리 메서드에 끌렸습니다. 그런데 조금 더 찾아보니 이 방식에는 생각보다 더 많은 장점이 있었습니다.

### 객체 재사용이 가능하다.

생성자는 호출할 때마다 무조건 새로운 객체를 만듭니다. 하지만 정적 팩토리 메서드는 캐싱된 객체를 반환할 수도 있습니다.

대표적인 예는 Boolean과 Integer 클래스입니다.

```java
Boolean a = Boolean.valueOf(true);
Boolean b = Boolean.valueOf(true);

// 항상 같은 객체를 반환
System.out.println(a == b); // true
```

내부 구현을 아래와 같습니다.

```java
public static final Boolean TRUE = new Boolean(true);
public static final Boolean FALSE = new Boolean(false);

public static Boolean valueOf(boolean b) {
    return (b ? TRUE : FALSE);
}
```

즉, `new Boolean(true)`를 매번 호출하는 대신 미리 만들어둔 상수를 그대로 반환하는 방식입니다. 이런 캐싱 덕분에 불필요한 객체 생성을 줄이고 성능까지 최적화할 수 있습니다

### 반환 타입의 하위 타입을 자유롭게 선택할 수 있다

정적 팩토리 메서드의 또 다른 장점은, 반환 타입이 인터페이스나 추상 클래스라면 어떤 하위 타입의 객체든 반환할 수 있다는 점입니다.

예를 들어 `EnumSet`을 보겠습니다.

```java
EnumSet<DayOfWeek> set = EnumSet.of(DayOfWeek.MONDAY, DayOfWeek.TUESDAY);
```

내부적으로는 원소 개수가 64개 이하면 `RegularEnumSet`, 그 이상이면 `JumboEnumSet`을 반환합니다.
클라이언트 입장에서는 이 두 클래스의 존재조차 몰라도 됩니다. 단지 EnumSet이라는 추상 타입만 사용하면 되니까요.

이 덕분에 JDK 개발자는 새로운 최적화된 구현체를 추가하거나, 기존 구현체를 교체하더라도 클라이언트 코드에 영향을 주지 않고 개선할 수 있습니다.

### 서비스 제공자 프레임워크의 기반이 된다

정적 팩토리 메서드는 `작성 시점에 반환할 클래스가 없어도 된다`는 특징이 있습니다. 이 유연함 덕분에 JDBC 같은 서비스 제공자 프레임워크가 가능해집니다.

- 서비스 인터페이스: java.sql.Connection, Driver
- 제공자 등록 API: 드라이버가 DriverManager에 자신을 등록
- 서비스 접근 API: DriverManager.getConnection(url, user, password)

```java
Connection conn = DriverManager.getConnection(
    "jdbc:mysql://localhost:3306/test", "user", "password"
);

```

이 코드만으로 MySQL, Oracle, H2 등 어떤 드라이버가 쓰일지 알 수 없지만, 클라이언트는 신경 쓸 필요가 없습니다. 내부적으로 정적 팩토리 메서드가 알맞은 구현체를 반환해주기 때문입니다.

이 구조 덕분에 JDBC는 수많은 데이터베이스 벤더가 각자의 드라이버를 제공할 수 있고, 클라이언트는 인터페이스에만 의존할 수 있습니다.

### 외부에서 알아야 할 API 수를 줄일 수 있다

마지막으로, 정적 팩토리 메서드는 외부에서 알아야 할 API 수를 줄이는 데 도움을 줍니다.

자바 컬렉션 프레임워크는 수십 개의 구현체를 갖고 있습니다. 만약 이들을 전부 public으로 노출했다면 개발자가 익혀야 할 클래스가 지나치게 많아졌을 겁니다.

하지만 JDK는 `Collections`라는 하나의 유틸리티 클래스 안에 정적 팩토리 메서드를 모아두었습니다.

```java
List<String> empty = Collections.emptyList();
List<String> unmodifiable = Collections.unmodifiableList(new ArrayList<>());
```

클라이언트는 `EmptyList`, `UnmodifiableList` 같은 실제 구현체를 알 필요가 없습니다. 덕분에 문서화해야 할 API의 범위가 줄고, 개발자가 익혀야 할 개념의 수도 감소합니다.

## 정적 팩토리 메서드의 단점

물론 단점도 있습니다.

첫째, **상속이 불가능합니다.** 정적 팩토리 메서드만 제공하려면 생성자를 private으로 막아야 하는데, 이렇게 되면 하위 클래스를 만들 수 없습니다. 하지만 이는 오히려 불변 객체를 설계하거나, 상속 대신 컴포지션을 사용하도록 유도하는 장점으로도 볼 수 있습니다.

둘째, **찾기 어렵습니다.** 생성자는 문서에서 명확히 드러나지만, 정적 팩토리 메서드는 그렇지 않습니다. API 문서를 잘 정리하지 않으면 “이 객체를 어떻게 만들어야 하지?” 하는 혼란이 생깁니다. 그래서 관례적인 이름(`of`, `from`, `valueOf`, `getInstance`, `newInstance`)을 따르는 게 중요합니다.

### 빌더와의 비교에서 나온 고민

실제로 동료 개발자와도 이런 얘기를 나눈 적이 있습니다. 동료는 “빌더를 쓰면 파라미터 순서에 신경 쓰지 않아도 되고, 같은 타입의 값이 여러 개 있어도 혼동이 없다”는 점을 장점으로 꼽았습니다. 이 말에 충분히 공감했습니다. 정적 팩토리 메서드는 결국 메서드 시그니처에 정의된 **순서대로 인자를 넘겨야 하고**, 동일한 타입의 **파라미터가 여러 개 있으면 어떤 값이 어떤 필드에 들어가는지 구분하기 어려운 문제**가 생길 수 있습니다.

실제로 제가 정적 팩토리 메서드로 리팩토링을 하면서도 이런 점을 체감했습니다. 특히 필드가 많은 객체의 경우, 혹시라도 잘못된 값이 들어갈까 싶어 항상 해당 클래스 정의를 열어보면서 하나하나 신경 써서 작업해야 했습니다. 빌더라면 필드명을 직접 지정할 수 있어 이런 걱정이 줄어들었을 텐데, 정적 팩토리 메서드에서는 어쩔 수 없이 순서와 타입에 의존해야 했습니다.

사실 코틀린에서는 이런 문제가 없습니다. named argument를 지원하기 때문에 파라미터 이름을 직접 지정할 수 있고, 순서를 바꿔도 상관없습니다.

```kotlin
val response = TerminalAuthResponse.rejected(
    reasonMessage = "Hot card",
    cardReferenceId = "12345",
    terminalResponseCode = TerminalResponseCode.DO_NOT_HONOR
)

```

이처럼 파라미터 이름을 직접 지정할 수 있으니 순서를 지키지 않아도 되고, 어떤 값이 어떤 의미인지 훨씬 명확합니다. 자바에도 언젠가 이런 기능이 들어온다면 정적 팩토리 메서드가 지금보다 훨씬 편리해질 것 같습니다.

## 팀 컨벤션으로 발전시키기

정적 팩토리 메서드를 단순히 개인 취향으로 쓰는 데서 끝나지 않고, 팀 차원에서도 합의된 규칙으로 발전시킬 필요가 있었습니다. 프로젝트 전반에 일관성을 유지하기 위해 다음과 같은 규칙을 정했습니다.

### @Setter 금지

- setter는 객체의 불변성을 깨뜨리기 쉽기 때문에 금지합니다.
- 필드는 반드시 생성자나 빌더를 통해 할당해야 합니다.

### 생성자는 Lombok @NoArgsConstructor(access = AccessLevel.PRIVATE)

외부에서 무분별하게 객체를 생성하지 못하게 제한합니다.

### @Builder + private 생성자 조합

실제 필드 초기화는 @Builder와 private 생성자를 통해서만 이뤄집니다

```java
@Builder
private TerminalAuthResponse(
        TerminalResponseCode responseCode,
        String approvalCode,
        String cardReferenceId,
        String reasonMessage
) {
    this.responseCode = responseCode;
    this.approvalCode = approvalCode;
    this.cardReferenceId = cardReferenceId;
    this.reasonMessage = reasonMessage;
}

```

### 정적 팩토리 메서드 작성

의도가 명확한 이름을 가진 정적 메서드를 통해 객체를 생성합니다.

```java
public static TerminalAuthResponse approved(String cardReferenceId, String approvalCode) {
    return TerminalAuthResponse.builder()
            .responseCode(TerminalResponseCode.APPROVED)
            .approvalCode(approvalCode)
            .cardReferenceId(cardReferenceId)
            .build();
}

```

이렇게 규칙을 문서화하고 팀 내 컨벤션으로 삼으면서, setter 기반 객체 생성 코드를 정적 팩토리 메서드 방식으로 꾸준히 교체해 나가고 있습니다.

## 맺으며

정적 팩토리 메서드가 무조건 옳은 해법은 아닙니다. 상황에 따라 생성자나 빌더가 더 적합할 수도 있습니다. 다만 저는 프로젝트를 리팩토링하면서 “이름을 가질 수 있다”는 단순한 이유 때문에 정적 팩토리 메서드를 선호하게 되었고, 그 과정에서 다른 장점들도 자연스럽게 알게 되었습니다.

지금은 회사 코드에서 setter 기반 생성을 정적 팩토리 메서드로 바꾸는 작업을 꾸준히 진행 중입니다. 다행히도 동료들을 잘 설득할 수 있었고, 이제는 팀 차원에서 컨벤션으로 발전시키는 중입니다.

결국 어떤 방식을 택할지는 개발자의 취향과 프로젝트의 맥락에 따라 달라질 수 있습니다. 중요한 건 각자의 상황 속에서 가장 읽기 좋고 유지보수하기 좋은 코드를 선택하는 것이라고 생각합니다.
