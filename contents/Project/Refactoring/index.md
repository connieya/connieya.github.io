---
date: '2024-03-22'
title: '스파게티 코드 리팩토링 하기 (feat. 전략 패턴 ,객체지향)'
categories: ['Project', 'refactoring']
summary: '상태 패턴과 객체지향 코드로 스파게티 코드 리팩토링 하기'
thumbnail: './img_2.png'
---

## 서문

내가 맡고 있는 프로젝트의 유지 보수를 마치고 다른 팀원이 하고 있는 챗봇 API 개발에 투입 되었다.

일정이 빠듯하게 진행되는 프로젝트로 기존 팀원이 하고 있는 API 개발을 나눠서 진행해야 했다.

일정 상 빠르게 개발해야 하다 보니, 기능이 동작하는 것을 우선으로 코드를 작성하셨다.

소스 코드 파악도 할겸 팀원 분께 기능에 영향을 미치지 않을 정도로만 리팩토링을 해도 되는지 양해를 구하였고, 흔쾌히 허락을 해주셨다. (감사합니다 ..)

## 스파게티 코드

아래 코드는 클라이언트가 보낸 이벤트에 맞는 챗봇 응답 값을 리턴하는 비즈니스 로직을 구현한 메서드이다.

```java
public EventResult getChatEvent(EventGetRequest eventRequest) {
        EventGetCommand eventGetCommand = EventGetCommand.create(eventRequest);
        List<Menus> menusList = chatMapper.getMenus(eventGetCommand);
        EventResult eventResult = new EventResult();

        processMenus(menusList, eventResult);
        if ("INIT".equals(eventGetCommand.getActEventCode())) {
            List<HamMenus> hamMenusList = chatMapper.getHamMenus(eventGetCommand);
            eventResult.setHamMenus(hamMenusList);

            processSimpleResponsesInit(chatMapper.getSimpleResponsesInit(eventGetCommand), menusList, eventResult);

            List<PopupsContent> combinedPopups = Stream.concat(
                    chatMapper.getPopups(eventGetCommand).stream(),
                    chatMapper.getPopupsProds(eventGetCommand).stream()).collect(Collectors.toList());
            processPopups(combinedPopups, eventResult);
            processCommons(chatMapper.getCommons(eventGetCommand), eventResult);

            List<PhraseContent> phraseContents = chatMapper.getPhrase(eventGetCommand);
            processPhrases(phraseContents, eventResult);
        } else if("SEARCH_EVENT".equals(eventGetCommand.getActEventCode())) {
            // .. 생략
        } else if("FAQ".equals(eventGetCommand.getActEventCode())) {
            //.. 생략
        }

        processSuggestions(chatMapper.getSuggestions(eventGetCommand), eventResult);

        eventResult.setLinkOutSuggestion(chatMapper.getLinkOutSuggestion(eventGetCommand));
        eventResult.setLocalCode(eventGetCommand.getCountryCode());
        eventResult.setLanguageCode(eventGetCommand.getLanguageCode());
        return eventResult;
    }


    private void processMenus(List<Menus> menusList, EventResult eventResult) {
        if (menusList == null || menusList.isEmpty())
            return;

        List<MainLink> mainLinks = menusList.stream()
                .filter(menu -> EventType.MAIN_LINK.name().equals(menu.getEventType()))
                .map(this::convertToMainLink)
                .collect(Collectors.toList());
        if (!mainLinks.isEmpty()) {
            eventResult.setMainLinks(mainLinks);
        }

        List<Menus> filteredMenus = menusList.stream()
                .filter(menu -> EventType.MENU.name().equals(menu.getEventType()))
                .collect(Collectors.toList());
        if (!filteredMenus.isEmpty()) {
            eventResult.setMenus(filteredMenus);
        }

        List<Prods> prods = menusList.stream()
                .filter(menu -> EventType.PROD_GROUP.name().equals(menu.getEventType())
                        || EventType.PROD.name().equals(menu.getEventType()))
                .map(this::convertToProd)
                .collect(Collectors.toList());
        if (!prods.isEmpty()) {
            eventResult.setProds(prods);
        }
    }

    private MainLink convertToMainLink(Menus menu) {
        MainLink mainLink = new MainLink();
        mainLink.setFromMenus(menu);
        return mainLink;
    }

    private Prods convertToProd(Menus menu) {
        Prods prod = new Prods();
        prod.setFromMenus(menu);
        return prod;
    }


    private void processSimpleResponsesInit(List<SimpleResponses> responses, List<Menus> menusList,
            EventResult eventResult) {
        if (responses == null || responses.isEmpty())
            return;

        if (!menusList.isEmpty() && EventCode.INIT.name().equals(menusList.get(0).getFromEventCode())) {
            List<Greeting> greetings = responses.stream()
                    .map(this::convertToGreeting)
                    .collect(Collectors.toList());

            eventResult.setGreetings(greetings);
            eventResult.setInputYn("N");
            eventResult.setPopupYn("N");
        } else {
            eventResult.setSimpleResponses(responses);
        }
    }

    private void processSimpleResponses(List<SimpleResponsesInputYn> responses, List<Menus> menusList,
            EventResult eventResult) {
        if (responses == null || responses.isEmpty())
            return;

        List<SimpleResponses> simpleResponses = responses.stream()
                .map(this::convertToSimpleResponses)
                .collect(Collectors.toList());
        if (!simpleResponses.isEmpty()) {
            eventResult.setSimpleResponses(simpleResponses);
            eventResult.setInputYn(responses.get(0).getInputYn());
            eventResult.setPopupYn(responses.get(0).getPopupYn());
            if (EventType.CHAT.name().equals(responses.get(0).getNextEventType())) {
                eventResult.setNextEventType(responses.get(0).getNextEventType());
            }
        }

    }

    private SimpleResponses convertToSimpleResponses(SimpleResponsesInputYn simpleResponsesInputYn) {
        SimpleResponses simpleResponses = new SimpleResponses();
        simpleResponses.setFromSimpleResponsesInputYn(simpleResponsesInputYn);
        return simpleResponses;
    }

     private Greeting convertToGreeting(SimpleResponses simpleResponses) {
        Greeting greeting = new Greeting();
        greeting.setFromGreeting(simpleResponses);
        return greeting;
    }

    private void processSuggestions(List<Suggestions> suggestions, EventResult eventResult) {
        if (suggestions != null && !suggestions.isEmpty()) {
            eventResult.setSuggestions(suggestions);
        }
    }
   // .... 그 외에 메서드들 생략

```

메서드의 길이가 많고 책임이 많다.

절차지향적으로 작성된 코드이다.

코드의 양이 너무 많아서 생략을 했는데도, 여전히 알아보기 힘들다.

동작은 잘 하지만 가독성이 좋고 유지보수 하기 좋은 코드로 리팩토링 해보자

## 원인 1.

### 절차지향 프로그래밍 (Procedural Programming)

위의 코드는 절차지향으로 되어 있다.

절차지향은 기능이 중심이 되며, "어떤 기능을 어떤 순서로 처리할 것인가?" 를 관점으로 프로그래밍 한다.

그렇기 때문에 하나의 큰 기능을 처리하기 위해 작은 단위의 기능들로 나누어 처리하는 Top-Down 접근 방식으로 설계 된다.

절차지향은 컴퓨터의 처리 구조와 유사해 실행 속도가 빠른 장점이 있지만
프로그램이 커질수록 유지보수가 어렵다는 단점이 있다.

클라이언트의 특정 이벤트 호출에 대한 채팅 데이터를 응답하는 메서드이지만,
절차지향으로 되어 있기 때문에 코드을 읽기가 어렵다.

코드를 이해하기 위해 작성한 메소드를 보고, 다시 메인 기능을 보고 스크롤을 여러 번 왔다 갔다 해야 했다.

## 리팩토링 1.

### 객체지향 프로그래밍 (Object-Oriented Programming)

객체에게 명령 대신 요청을 담은 메시지를 전달하면 객체는 이를 어떻게 처리할지 자율적으로
판단하고, 내부에 가지고 있는 데이터를 이용해 필요한 작업을 수행하는 방식

책임과 권한을 가진 객체들이 서로 메시지를 주고 받으며 협력해서 필요한 기능을 수행하도록
시스템을 개발하는 방식

#### 변환 로직 위임하기

챗봇의 데이터를 DB에서가져와 클라이언트가 원하는 데이터를 응답하기 위해 데이터를 변환하는 작업을 하고 있다.

```java
    // .. 생략

      private void processSimpleResponsesInit(List<SimpleResponses> responses, List<Menus> menusList,
            EventResult eventResult) {
        if (responses == null || responses.isEmpty())
            return;

        if (!menusList.isEmpty() && EventCode.INIT.name().equals(menusList.get(0).getFromEventCode())) {
            List<Greeting> greetings = responses.stream()
                    .map(this::convertToGreeting)
                    .collect(Collectors.toList());

            eventResult.setGreetings(greetings);
            eventResult.setInputYn("N");
            eventResult.setPopupYn("N");
        } else {
            eventResult.setSimpleResponses(responses);
        }
    }


     private Greeting convertToGreeting(SimpleResponses simpleResponses) {
        Greeting greeting = new Greeting();
        greeting.setFromGreeting(simpleResponses);
        return greeting;
    }
    // ..  생략

```

이 부분을 객체에게 위임하는 것이 좋을 것 같다. 애플리케이션 레벨에서 변환하는 것은 코드만 길어지고 책임이 많이 진다.

```java
@Getter
public class Greeting {

    private String stringToSpeech;
    private String displayText;
    private String displayType;

    @Builder
    private Greeting(String stringToSpeech, String displayText, String displayType) {
        this.stringToSpeech = stringToSpeech;
        this.displayText = displayText;
        this.displayType = displayType;
    }

    public static Greeting from(SimpleResponses simpleResponses) {
        return Greeting
                .builder()
                .stringToSpeech(simpleResponses.getStringToSpeech())
                .displayText(simpleResponses.getDisplayText())
                .displayType(simpleResponses.getDisplayType())
                .build();
    }
}
```

애플리케이션 레이어에서 작업하던 변환 로직을 Greeting 객체에게 위임하면 자율적으로 처리하게 하였다.

이제 애플리케이션 레이어에 변환 메서드는 전부 지워버렸다.

#### 챗봇 응답 정보 위임

챗봇 응답 정보를 처리하는 것을 아래 애플리케이션 레이어가 아닌

```java
private void processMenus(List<Menus> menusList, EventResult eventResult) {
        if (menusList == null || menusList.isEmpty())
                return;

        List<MainLink> mainLinks = menusList.stream()
                .filter(menu -> EventType.MAIN_LINK.name().equals(menu.getEventType()))
                .map(this::convertToMainLink)
                .collect(Collectors.toList());
        if (!mainLinks.isEmpty()) {
            eventResult.setMainLinks(mainLinks);
        }

        List<Menus> filteredMenus = menusList.stream()
                .filter(menu -> EventType.MENU.name().equals(menu.getEventType()))
                .collect(Collectors.toList());
        if (!filteredMenus.isEmpty()) {
            eventResult.setMenus(filteredMenus);
        }

        List<Prods> prods = menusList.stream()
                .filter(menu -> EventType.PROD_GROUP.name().equals(menu.getEventType())
                        || EventType.PROD.name().equals(menu.getEventType()))
                .map(this::convertToProd)
                .collect(Collectors.toList());
        if (!prods.isEmpty()) {
            eventResult.setProds(prods);
        }
    }

```

EventResult 객체에 위임해서 EventResult 가 자율적으로 처리한다.

```java
public class EventResult {
    private List<Menus> menus;
    private List<Prods> prods;
    private List<HamMenus> hamMenus;
    private List<SimpleResponses> simpleResponses;
    // .. 생략


    public EventResult() {

    }

    public void processMenus(List<Menus> menusList) {
        if (menusList == null || menusList.isEmpty())
            return;

        this.mainLinks = menusList
                .stream()
                .filter(menu ->
                        EventType.MAIN_LINK.name().equals(menu.getEventType())
                )
                .map(MainLink::from)
                .collect(Collectors.toList());

        this.menus = menusList.stream()
                .filter(menu -> EventType.MENU.name().equals(menu.getEventType()))
                .toList();

        this.prods = menusList.stream()
                .filter(menu -> EventType.PROD_GROUP.name().equals(menu.getEventType())
                        || EventType.PROD.name().equals(menu.getEventType()))
                .map(Prods::from)
                .toList();
    }
}
```

챗봇 이벤트에 따라 응답 결과가 null 인 부분이 있을 수 있기 때문에
List 클래스에 따로 조건 분기를 처리하지 않고 바로 값을 할당하여 코드 라인을 줄였다.

```java
   public EventResult getChatEvent(EventGetRequest eventRequest, String chatId) {
        EventGetCommand eventGetCommand = EventGetCommand.create(eventRequest);
        List<Menus> menusList = chatMapper.getMenus(eventGetCommand);
        EventResult eventResult = new EventResult();

        eventResult.processMenus(menusList);
        if ("INIT".equals(eventGetCommand.getActEventCode())) {
            eventResult.processHamMenus(chatMapper.getHamMenus(eventGetCommand));
            eventResult.processSimpleResponses(chatMapper.getSimpleResponsesInit(eventGetCommand), menusList);
            List<PopupsContent> combinedPopups = Stream.concat(
                    chatMapper.getPopups(eventGetCommand).stream(),
                    chatMapper.getPopupsProds(eventGetCommand).stream()).collect(Collectors.toList());
            eventResult.processePopups(combinedPopups);
            eventResult.processeCommons(chatMapper.getCommons(eventGetCommand));
            eventResult.processPhaseList(chatMapper.getPhrase(eventGetCommand));
        }else if("SEARCH_EVENT".equals(eventGetCommand.getActEventCode())) {
            // .. 생략
        } else if("FAQ".equals(eventGetCommand.getActEventCode())) {
            //.. 생략
        } else {
            eventResult.processSimpleResponses(chatMapper.getSimpleResponses(eventGetCommand));
        }
        eventResult.processSuggestions(chatMapper.getSuggestions(eventGetCommand));
        eventResult.processeLinkOutSuggestion(chatMapper.getLinkOutSuggestion(eventGetCommand));
        eventResult.setLocaleCode(eventGetCommand.getCountryCode());
        eventResult.setLanguageCode(eventGetCommand.getLanguageCode());
        return eventResult;
    }

    // 변환 로직 객체에 위임

    // 응답 처리 로직 객체에 위임
```

변환 로직과 응답 처리 로직을 애플리케이션 레벨이 아닌
객체가 자율적으로 행동하게 위임 하고 나니 코드 라인 130 줄이 사라졌고 가독성이 조금 좋아지고 유지보수 하기 좋아졌다.

### set 메서드 대신 의미가 잘 드러나는 메서드

위의 코드에는

## 원인 2.

### 챗봇 이벤트 요청에 맞는 다양한 응답 결과

클라이언트가 요청하는 이벤트의 종류에 따라서 다른 응답 결과를 반환 해야 한다.

현재 코드는 if else 문을 통해 각 이벤트 요청에 맞는 응답 결과를 처리하고 있다.

```java
    if ("INIT".equals(eventGetCommand.getActEventCode())) {
           // .. 생략
    }else if("SEARCH_EVENT".equals(eventGetCommand.getActEventCode())) {
            // .. 생략
    } else if("FAQ".equals(eventGetCommand.getActEventCode())) {
            //.. 생략
    } else {
           // .. 생략
    }
```

하지만 위의 코드는 이벤트 종류에 따른 응답 결과가 한 코드에 섞여 있어 코드를 이해하기 어렵다.

이벤트가 추가될 때마다 if 블록을 계속 추가해야 하기 때문에 더욱 복잡해질 수 있고 나중에는 유지 보수 할 때 많은 어려움을 겪을 수 있다.

## 리팩토링 2.

### 전략 패턴 (Strategy Pattern) 적용

위의 문제를 해결하기 위해서 각 이벤트에 대한 처리 로직을 별도 객체로 분리하여 관리 해야 한다.

이벤트 처리 로직에 맞게 분리 된 객체는 ChatService 클래스에서 요청한 이벤트에 맞는 전략을 선택하여 실행한다.

```java
public interface EventStrategy {

    EventResult execute(EventGetRequest eventGetRequest, EventGetCommand eventGetCommand);
}
```

```java
@RequiredArgsConstructor
@Service
public class InitEventStrategy implements EventStrategy{

    private final ChatMapper chatMapper;

    @Override
    public EventResult execute(EventGetRequest eventGetRequest, EventGetCommand eventGetCommand) {
        EventResult eventResult = new EventResult();
        List<Menus> menusList = chatMapper.getMenus(eventGetCommand);
        eventResult.initializeHamMenus(chatMapper.getHamMenus(eventGetCommand));
        eventResult.initializeSimpleResponses(chatMapper.getSimpleResponsesInit(eventGetCommand),
                menusList);
        // .. 생략
        return eventResult;
    }
}

```

```java
@RequiredArgsConstructor
@Service
public class SearchEventStrategy implements EventStrategy{

    private final ChatMapper chatMapper;

    @Override
    public EventResult execute(EventGetRequest eventGetRequest, EventGetCommand eventGetCommand) {
        EventResult eventResult = new EventResult();
        eventResult.initializeLinkOutSuggestion(
                chatMapper.getModelNumberLinkOutSuggestion(eventGetCommand));
        eventResult.initializeSimpleResponses(chatMapper.getSimpleResponses(eventGetCommand));
        // .. 생략
        return eventResult;
    }
}
```

```java
@Component
public class EventActionProvider {

    private  Map<String, EventStrategy> eventActions;

    public EventActionProvider(final InitEventStrategy initEventStrategy, final SearchEventStrategy searchEventStrategy, final FAQStrategy faqStrategy, final DefaultStrategy defaultStrategy) {
        this.eventActions = new HashMap<>();
        this.eventActions.put("INIT", initEventStrategy);
        this.eventActions.put("SEARCH_EVENT", searchEventStrategy);
        this.eventActions.put("FAQ", faqStrategy);
        this.eventActions.put("DEFAULT", defaultStrategy);
    }

    public EventStrategy getEventStrategy(String event) {
        EventStrategy strategy = eventActions.get(event);
        if (strategy == null) {
            strategy = eventActions.get("DEFAULT"); // Get DEFAULT strategy if event not found
        }
        return strategy;
    }

}


```

### No Silver Bullet

"은총알은 없다"

객체지향 프르그래밍이 은총알은 아니다. 객체지향이 적합하지 않은 상황에서는 언제라도 다른
패러다임을 적용할 수 있는 시야를 기르고 지식을 갈고 닦아야 한다.
