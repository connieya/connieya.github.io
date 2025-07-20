---
date: '2025-07-18'
title: 'Mock, Spy 그리고 Fake: 당신의 테스트는 무엇을 검증하고 있는가?'
categories: ['test-double']
---

테스트 코드는 소프트웨어의 품질을 유지하기 위한 중요한 도구입니다. 특히 복잡한 시스템일수록, 외부 의존성을 격리하고 대상 로직만을 검증하기 위해 '테스트 더블(Test Double)'을 적절히 사용하는 것이 필수적입니다.

하지만 테스트 더블의 개념은 다소 모호하게 전달되는 경우가 많고, 이를 잘못 사용하면 테스트는 통과하더라도 실제 서비스 환경에서 문제가 발생할 수 있습니다.

이 글은 제가 하나의 '버그'를 두고, 각기 다른 테스트 더블들이 어떻게 반응하는지를 추적하며 얻은 명확한 사용 기준에 대한 기록입니다.

<br/>

### 테스트 더블: 무엇을 위한 대역인가?

테스트 더블은 테스트 대상(SUT, System Under Test)이 의존하는 객체를 대체하는 가짜 객체의 총칭입니다. 각 더블은 저마다 다른 목적을 가집니다.

- Dummy: 말 그대로 '더미'입니다. 객체는 필요하지만 그 기능은 전혀 사용되지 않을 때, 메서드의 인자 자리를 채우기 위해 전달되는 깡통 객체입니다. 보통 `null`을 전달하거나 비어 있는 객체를 생성하여 사용합니다.

- Fake: 실제 구현을 단순화하여 대체한 경량화된 구현체입니다. 실제 DB 대신 HashMap 기반의 인메모리 Repository를 만드는 것이 대표적인 예입니다. 실제처럼 동작하지만, 프로덕션에서는 사용할 수 없습니다.
- Stub: 상태 검증(State Verification)을 위한 더블입니다. 호출 시 미리 정해진 고정된 응답을 제공하는 것이 주된 역할입니다. `userRepository.findById("id")` 호출 시 항상 `Optional.of(user)`를 반환하게 만드는 것이 대표적입니다.

- Mock: 행위 검증(Behavior Verification)을 위한 더블입니다. 메서드가 올바른 인자로, 정확한 횟수만큼 호출되었는지를 검증하는 데 집중합니다. `verify(...)`와 같이 상호작용 자체를 테스트합니다.

- Spy: 실제 객체를 감싸는 더블입니다. 기본적으로 실제 객체의 로직을 그대로 수행하지만, 필요에 따라 특정 메서드의 행동만 선별적으로 조작하거나 호출 여부를 기록할 수 있습니다.

<br/>

### 도구의 이름보다 중요한 것은 '역할'

저는 오랫동안 테스트 더블의 **'역할'** 과 Mockito가 제공하는 **'도구'** 의 정체성을 혼동했습니다.
`@Mock` 어노테이션을 썼으니 당연히 **Mock의 역할**일 것이고, `spy()` 메서드를 썼으니 **Spy**일 것이라 단정했습니다.

`when-then` 구문은 Mock의 전유물이고, `doReturn-when` 은 Spy만 쓰는 특별한 문법이라는 틀에도 갇혀 있었습니다.

하지만 `@Mock`으로 만든 객체가 `verify` 없이 값만 반환하며 `Stub`처럼 동작하고, `spy()`로 만든 객체 역시 실제 로직을 실행하지 못하는 stub으로 전락하는 것을 보며, 이 모든 공식이 무너지는 경험을 했습니다.

중요한 것은 사용한 도구의 이름이 아니라 그 도구를 통해 **어떤 역할을 수행하게 만들었는지** 즉, 달성하려는 **테스트의 목적이**라는 것을 깨닫게 되었습니다.

<br/><br/>

#### 테스트 더블 사용하기 전, 도메인 구조 간단히 살펴보기

테스트 더블(mock, spy, fake 등)을 다루기 전, 이들이 어떻게 사용되는지를 이해하기 위해 먼저 애플리케이션의 도메인 구조를 간단히 짚고 넘어가겠습니다.

<br/>

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class UserRepositoryAdapter implements UserRepository {

    private final UserJpaRepository userJpaRepository;

    @Override
    public Optional<User> findByUserId(String id) {
        return userJpaRepository.findByUserId(id)
                .map(UserEntity::toDomain);
    }

    @Override
    public User save(User user) {
        return userJpaRepository.save(UserEntity.fromDomain(user)).toDomain();
    }
}
```

- UserService: 비즈니스 로직을 처리하며, UserRepository 인터페이스에 의존합니다.
- UserRepositoryAdapter: UserRepository의 구현체로, 도메인 객체(User)를 영속성 객체(UserEntity)로 변환하여 UserJpaRepository에 전달하는 '어댑터' 역할을 합니다.
- UserEntity: 실제 DB와 매핑되는 JPA 엔티티입니다

<br/>

### Mock의 배신: 초록불 뒤에 숨겨진 버그

**테스트 목표**: 회원 가입 시 `User` 저장이 수행되어야 합니다.

처음에는 SUT와 협력 객체 간의 '상호작용'을 검증하는 데 집중하는, 소위 '런던파(London School)' 스타일로 접근하였습니다.

`@Mock`으로 `UserRepository`를 만들고, `verify()`로 `save()` 호출 여부만 확인하였습니다.

<br/>

```java
@ExtendWith(MockitoExtension.class)
class UserServiceMockTest {

    @InjectMocks
    private UserService userService;

    @Mock
    private UserRepository userRepository;

    @Test
    @DisplayName("회원 가입시 User 저장이 수행된다.")
    void registerSuccess() {
        // given
        String userId = "geonhee77";
        String email = "geonhee77@naver.com";
        String birthDate = "2020-01-01";
        Gender gender = Gender.MALE;
        UserRegisterCommand command = UserRegisterCommand.of(userId, email, birthDate, gender);
        User savedUser = User.create(userId, email, birthDate, gender);

        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        // when
        UserRegisterResult result = userService.register(command);

        // then
        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository, times(1)).save(userCaptor.capture());

        User capturedUser = userCaptor.getValue();
        assertThat(capturedUser.getId()).isEqualTo(userId);
        assertThat(capturedUser.getEmail()).isEqualTo(email);
        assertThat(result.id()).isEqualTo(savedUser.getId());
        assertThat(result.email()).isEqualTo(email);
    }
}
```

<br/>

테스트는 통과했지만, 이는 SUT가 의존하는 User.create()나 내부 매핑 로직에 버그가 있더라도 전혀 감지하지 못한다는 심각한 문제를 안고 있었습니다.

예를 들어, 동료 개발자가 User를 UserEntity로 변환하는 과정에서 아래와 같이 이메일을 하드코딩하는 실수를 저질렀다고 가정해 보겠습니다.

```java
public static UserEntity fromDomain(User user) {
        UserEntity userEntity = new UserEntity();

        userEntity.userId = user.getId();
        userEntity.email = "BUG@example.com"; // 이메일 하드코딩 버그!
        userEntity.birthDate = user.getBirthDate().getBirthDate();
        userEntity.gender = user.getGender();

        return userEntity;
    }
```

<br/>

그리고 이 버그가 포함된 fromDomain 메서드는 다음과 같이 UserRepositoryAdapter의 save 메서드 내부에서 사용됩니다.

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class UserRepositoryAdapter implements UserRepositoryOut {

    private final UserJpaRepository userJpaRepository;

    // ...

    @Override
    public User save(User user) {
        return userJpaRepository.save(UserEntity.fromDomain(user)).toDomain();
    }
}

```

<br/>

이 코드는 모든 신규 회원의 이메일을 "BUG@example.com"으로 저장하게 됩니다. 하지만 Mock 기반의 테스트는 이 버그를 전혀 잡아내지 못하였습니다.

@Mock은 속이 텅 빈 가짜 객체를 생성합니다. UserRepository의 실제 구현체인 UserRepositoryAdapter와는 전혀 관련이 없습니다.

따라서 버그가 포함된 매핑 로직은 테스트 중 단 한 줄도 실행되지 않았습니다.

테스트는 그저 우리가 약속한 대로 행동할 뿐이며, 실제 운영에서는 심각한 버그가 발생하더라도 테스트는 여전히 초록불을 띄우며 "괜찮다"고 말하게 됩니다.

이것이 많은 개발자들이 “Mock을 최소화해야 한다”고 이야기하는 이유입니다. 좀 더 실제 실행 흐름에 가까운 테스트가 필요했습니다.

<br/>

### Fake : 어설픈 가짜는 버그를 놓친다

'상태'를 검증하는 것을 중시하는 '고전파(Classicist School)' 또는 '시카고파'로 알려진 Fake 객체를 도입하였습니다.

실제 DB 대신 가볍고 빠른 인메모리 저장소를 사용함으로써, 실제 환경과 유사한 조건에서 최종 상태를 효과적으로 검증할 수 있습니다.

<br/>

```java
public class FakeUserRepository implements UserRepository {
    private final Map<String, User> storage = new HashMap<>(); // 도메인 객체를 그대로 저장

    public User save(User user) {
        storage.put(user.getId(), user);
        return user;
    }
    // ...
}
```

<br/>

이 Fake를 사용한 테스트는 다음과 같습니다.

```java
@ExtendWith(MockitoExtension.class)
class UserServiceFakeTest {

    private UserService userService;

    @BeforeEach
    void setUp() {
        FakeUserRepository fakeUserRepository = new FakeUserRepository();
        userService = new UserService(fakeUserRepository);
    }

    @Test
    @DisplayName("회원 가입시 User 저장이 수행된다.")
    void registerSuccess() {
        // given
        String id = "geonhee77";
        String email = "geonhee77@naver.com";
        String birthDate = "1990-01-01";
        Gender gender = Gender.MALE;
        UserRegisterCommand userRegisterCommand = UserRegisterCommand.of(id, email, birthDate, gender);

        // when
        UserRegisterResult userRegisterResult = userService.register(userRegisterCommand);

        // then
        assertAll(() -> {
            assertThat(userRegisterResult.id()).isEqualTo(id);
            assertThat(userRegisterResult.email()).isEqualTo(email);
            assertThat(userRegisterResult.birthDate()).isEqualTo(birthDate);
        });

    }

}
```

결과: 테스트 성공(초록불)

또 다시 버그를 잡는 데 실패했습니다.

이 단순한 Fake는 UserService가 전달해준 User 객체를 그대로 저장할 뿐, 실제 어댑터가 수행하는 중요한 매핑 로직을 완전히 누락하고 있습니다.

우리가 잡으려는 버그는 UserRepositoryAdapter 내부에 숨어있는데, 이 단순한 Fake는 그곳까지 도달하지 못했던 것입니다.

<br/>

### 정교한 Fake : 드디어 버그를 잡다

Fake를 실제 어댑터의 책임까지 흉내 내도록 진화시켰습니다.

진화한 Fake (어댑터 모방 모델):

```java
public class FakeUserRepository implements UserRepository {
    // 내부적으로는 Entity 형태로 데이터를 저장한다.
    private final Map<String, UserEntity> entityStorage = new HashMap<>();

    @Override
    public User save(User user) {
        // Fake 내부에서 직접 매핑 로직을 수행!
        UserEntity entity = UserEntity.fromDomain(user); // 버그가 있는 코드가 여기서 실행된다!
        entityStorage.put(entity.getUserId(), entity);
        return entity.toDomain();
    }
    // ...
}
```

<br/>

결과: 테스트 실패(빨간불).

```
expected: <geonhee77@naver.com> but was: <BUG@example.com>
```

드디어 버그를 잡았습니다! 하지만 이 시점에서 또 다른 의문이 생겼습니다.

"이 정교한 Fake는 버그를 잡았지만, 이건 내가 버그가 있다는 걸 알고 의도적으로 만든 특수한 경우 아닌가? 보통 실무에서 누가 이렇게까지 Fake를 정교하게 만들까?"

"만약 정교하게 만든다고 해도, **이 Fake를 만드는 데 드는 시간과 노력(Cost)** 을 생각하면, 차라리 실제 DB를 붙여서 **통합 테스트를 작성하는 것의 ROI(투자 대비 효과)** 가 더 높지 않을까?"

"결정적으로, 이 Fake도 결국 내가 만든 코드다. 내가 만든 프로덕션 코드를 테스트하기 위해, 또 다른 코드를 내가 만들어서 테스트한다? 이 가짜를 어떻게 신뢰할 수 있지? 다른 사람이 만든 Fake가 내 테스트의 목적과 맞지 않을 수도 있는데?"

결국 테스트 더블의 세계에 '정답'은 없었다. 오직 내가 테스트하려는 대상의 책임과 의존성의 복잡도, 그리고 ROI를 끊임없이 저울질하며 최적의 '선택'을 내려야 하는 트레이드오프의 연속만이 존재할 뿐이다.

<br/>

### Spy : 실제 로직을 탐험하는 최후의 수단

그렇다면 실제 구현체를 사용하면서도 테스트할 방법은 없을까요?

이것이 바로 Spy가 필요한 이유입니다.

Mock vs. Spy의 차이점:

- Mock: 허상의 가짜 객체로, 실제 로직이 전혀 없습니다.
- Spy: 실제 객체를 감싸는 투명한 옷으로, 기본적으로 실제 로직이 그대로 실행됩니다.

이 차이를 명확히 확인하기 위해 UserRepositoryAdapter에 로그를 추가하였습니다.

<br/>

```java
public User save(User user) {
    System.out.println(">>> UserRepositoryAdapter.save() 실제 로직 실행됨! <<<");
    return userJpaRepository.save(UserEntity.fromDomain(user)).toDomain();
}

```

<br/>

Spy 테스트는 다음과 같습니다.

Spy를 사용하되, 내부의 DB 접근(userJpaRepository)만 Mock으로 차단했습니다.

```java
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @InjectMocks
    private UserService userService;

    @Mock
    private UserJpaRepository userJpaRepository;

    private UserRepositoryAdapter userRepositoryAdapter;

    @BeforeEach
    void setUp() {
        userRepositoryAdapter = spy(new UserRepositoryAdapter(userJpaRepository));
        userService = new UserService(userRepositoryAdapter);
    }

    @Test
    @DisplayName("회원 가입시 User 저장이 수행된다.")
    void registerSuccess() {
        // given
        String id = "geonhee77";
        String email = "geonhee77@naver.com";
        String birthDate = "1990-01-01";
        Gender gender = Gender.MALE;

        UserRegisterCommand userRegisterCommand = UserRegisterCommand.of(id, email, birthDate, gender);


        doReturn(UserEntity.fromDomain(User.create(id, email, birthDate, gender))).when(userJpaRepository).save(any(UserEntity.class));

        // when
        UserRegisterResult userRegisterResult = userService.register(userRegisterCommand);


        // then
        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepositoryAdapter, times(1)).save(userCaptor.capture());


        assertThat(userRegisterResult.id()).isEqualTo(id);
        assertThat(userRegisterResult.email()).isEqualTo(email);
    }
}
```

<br/>

실행 결과는 다음과 같습니다.

```java
>>> UserRepositoryAdapter.save() 실제 로직 실행됨! <<<
```

테스트 결과 : 실패

```java
expected: <geonhee77@naver.com> but was: <BUG@example.com>
```

<br/>

로그가 찍혔다는 것은 Spy가 save 메서드의 실제 로직을 실행했다는 명백한 증거이며, 그 결과 숨어있던 버그를 정확히 찾아냈습니다.

Spy를 통해 실제 로직이 실행되었으며, 테스트도 실패하면서 버그를 잡아주었습니다.

하지만 만약, 아래와 같이 Stubbing 대상을 userJpaRepository가 아닌 userRepositoryAdapter 자신으로 바꾸면 어떻게 될까요?

```java
doReturn((User.create(id, email, birthDate, gender))).when(userRepositoryAdapter).save(any(User.class));
```

그러면 결과는 테스트 성공입니다. 그리고 콘솔에 아무런 로그가 찍히지 않았습니다.

위의 코드는 "save 메서드가 호출되면, 실제 로직 실행은 잊어버리고, 내가 주는 이 값을 반환해!" 라고 하는 것과 같습니다

Spy를 실제 로직을 단 한 줄도 실행하지 못하고, 정해진 값만 반환하는 거대한 Stub로 사용한 것입니다.

System.out.println 로그가 찍히지 않은 것이 그 증거입니다

테스트는 성공했지만, 버그는 여전히 코드 속에 숨어있습니다.

이것이 바로 제가 이전에 저질렀던 '도구와 역할을 혼동한' 실수이며, Spy를 사용할 때 가장 경계해야 할 지점입니다.

<br/>
<br/>

#### Spy 는 우리에게 무엇을 보여주었는가?

이 테스트는 단순히 버그를 잡은 것 이상의 의미를 가집니다. 이것은 앞선 Fake 방식과 비교했을 때 Spy의 본질적인 가치를 보여줍니다.

FakeRepository 는 UserEntity.fromDomain()을 호출하고, 결과를 다시 toDomain()으로 변환하는 로직을 테스트 코드 안에 재구현했습니다.

이것은 꽤나 번거로운 작업이며, 만약 어댑터의 로직이 바뀐다면 Fake의 로직도 함께 수정해야 하는 유지보수 부담을 안겨줍니다.

하지만 Spy를 사용함으로써, 우리는 프로덕션 코드(UserRepositoryAdapter)를 그대로 재사용했습니다.

우리는 어댑터의 로직을 모방할 필요가 없었습니다. 단지 어댑터가 외부 세계(DB)와 만나는 가장 마지막 관문인 userJpaRepository만 Mock으로 막았을 뿐입니다.

이것이 바로 Spy의 진정한 강점입니다.

`Spy는 실제 구현체의 복잡하고 가치 있는 로직은 그대로 활용하면서, 테스트를 방해하는 외부 I/O 부분만 정밀하게 제어할 수 있게 해줍니다.`

<br/>
<br/>

### 관심사에 따른 최적의 도구 선택

이 모든 경험을 통해 나는 테스트 더블을 선택하는 명확한 기준을 세울 수 있었다.

그것은 “어떤 어노테이션을 쓸까?”가 아니라, “내가 검증하려는 핵심 관심사가 무엇인가?” 입니다.

- 관심사 1 : **상호작용 검증** 👉 **Mock**

SUT가 의존 객체의 올바른 메서드를 호출했는지를 확인하고자 할 때 적합합니다. 가장 순수한 단위 테스트에 사용됩니다.

- 관심사 2 : **최종 상태 검증** 👉 **Fake**

로직 실행 후 시스템의 상태가 올바른지 확인하고자 할 때, 리팩토링에 강건하고 신뢰도가 높습니다.

- 관심사 3 : **SUT 또는 협력 객체의 복잡한 실제 로직 검증** 👉 **Spy**

복잡한 도메인 로직 또는 협력 객체의 실제 동작이 핵심일 경우, 외부 I/O만 정밀하게 차단하며 현실적인 단위 테스트를 구성할 수 있습니다.

<br/>
<br/>

### 맺으며

테스트 코드의 목적은 '검증'이니, 검증에 통과하는 것에만 초점을 맞추는 것이 당연하다고 생각했습니다.

그래서 빨간불이 보이면 초조한 마음에 어떻게든 초록불을 보는 것에만 집중했던 것 같습니다. 마치 '답정너'처럼, 테스트에게 초록불을 보여달라고 강요하는 코드를 작성해왔던 것이었습니다.

이러한 관점으로 테스트 더블을 단순히 '도구'로만 생각하고 접근하는 것이 얼마나 위험할 수 있는지 깨닫게 되었습니다.

좋은 테스트란 무조건 성공하는 것이 아니라 실패해야 할 상황에서 정확하게 실패하며 우리에게 문제를 알려주는 것이었습니다.

이 생각을 바탕으로 이제는 테스트 더블의 목적을 먼저 고민하고, 그에 맞는 역할을 수행할 수 있도록 도구를 신중하게 사용해야겠습니다.
