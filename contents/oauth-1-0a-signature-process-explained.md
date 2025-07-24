---
date: '2025-03-07'
title: 'OAuth 1.0a, 복잡하지만 견고한 레거시 '
categories: ['OAuth']
---

TLCM (Token Life Cycle Management) 프로젝트 진행하면서 마주했던 OAuth 1.0a 에 대해 정리해 보았습니다.

"요즘 누가 OAuth 1.0a를 써?" 라고 생각할 수 있지만 , 여전히 일부 브랜드사(특히 금융권) 에서는 굳건히 이 방식을 고수하고 있습니다.



## OAuth 1.0a: 메시지 레벨 서명이 핵심인 인증 프로토콜

OAuth 1.0a 는 클라이언트 애플리케이션이 리소스 서버 (API 서버)에 접근할 때 자신을 인증하고 권한을 부여받기 위한 프로토콜입니다.

이 프로토콜의 가장 큰 특징이자 핵심은 바로 모든 API 요청에 대한 디지털 서명입니다.

MasterCard와 연동 후 우리가 주고 받은 모든 API 요청에는 Authorization 이라는 HTTP 헤더가 포함되며,
이 헤더의 OAuth 스킴 내부에
여러 파라미터와 함께 oauth_signature 라는 서명 값이 들어갑니다.

```java
Authorization: OAuth
    oauth_body_hash="94cOcstEzvTvyBcNV94PCbo1b5IA35XgPf5dWR4OamU=",
    oauth_nonce="32lqGrI0f0nQEW85",
    oauth_signature="MhfaStcHU0vlIoeaBLuP14(...)qqd99lI56XuCk8RM5dDA%3D%3D",
    oauth_consumer_key="aXqayIybNdwMnzGIZMAkQYSq(...)139a87746d5b00000000000000",
    oauth_signature_method="RSA-SHA256",
    oauth_timestamp="1558370962",
    oauth_version="1.0"
```



## OAuth 1.0a , 왜 이렇게 복잡해? - Signature Bsse String 과 서명

OAuth 1.0a 에서 서명은 단순한 메시지 자체가 아니라, 여러 요소들을 조합하여 만든 **서명 베이스 문자열(Signature Base String)** 을 해시한 후 개인 키로 서명하는 방식입니다.

이 서명 베이스 문자열을 만드는 과정은 매우 중요하며,
클라이언트와 서버가 정확히 동일하게 재구성해야 합니다.

구성 요소

- HTTP 메소드
- Base URL : 요청의 기본 URL (쿼리 파라미터 제외)
- 정규화된 요청 파라미터 문자열 : 위 Authorization 헤더에 포함된 모든 OAuth 파라미터 (단, oauth_signature 제외) , 쿼리 파라미터 , 그리고 application/x-www-form-urlencoded 형식의 요청 본문 파라미터(있는 경우)를 알파벳 순으로 정렬하고 특정 규칙에 따라 인코딩한 문자열

이 세 가지 요소들을 특정 구분자로 연결하여 만듭니다.

**정규화의 중요성:**

이러한 복잡한 '정규화' 규칙은 클라이언트와 서버가 서로 다른 환경에서 작동하더라도 항상 동일한 '서명 베이스 문자열'을 생성할 수 있도록 보장합니다.

단 하나의 공백 , 인코딩 방식, 파라미터 순서의 차이도 최종 서명 값을 다르게 만들기 때문입니다.

<br/>

### application/x-www-form-urlencoded가 아닌 요청 본문은 왜 서명되지 않을까??

기본적인 OAuth 1.0a 표준 (RFC 5849) 은 application/x-www-form-urlencoded 타입의 요청 본문에 포함된 파라미터들만 서명 베이스 문자열에 포함하도록 명시합니다. 이는 웹 폼 제출의 전통적인 방식에 맞춰 설계된 것입니다.

하지만 JSON, XML, 바이너리 데이터(application/json, application/xml, multipart/form-data 등)와 같은 다른 Content-Type을 가진 요청 본문의 경우, 표준 OAuth 1.0a는 이러한 본문 내용을 서명 대상에 포함시키는 명시적인 메커니즘을 제공하지 않았습니다.

그 이유는 application/x-www-form-urlencoded와 달리, `JSON`이나 `XML`과 같은 데이터 포맷은 동일한 의미를 가진 데이터라도 문자열 표현이 달라질 수 있기 때문입니다.

예를 들어 JSON의 키 순서, 불필요한 공백(whitespace), XML의 속성 순서, 네임스페이스 선언 방식 등은 유연성을 제공하지만, 이를 서명에 포함하려면 엄격한 **정규화 규칙** 이 필요합니다.

OAuth 1.0a 설계 당시에는 이러한 복잡한 구조화된 본문에 대한 통일된 정규화 및 서명 방식을 정의하는 데 어려움이 있었고, 결과적으로 서명 검증 불일치가 발생할 수 있었습니다.

따라서, 본질적으로 JSON이나 XML 본문을 그대로 서명 베이스 문자열에 포함시키는 것이 기술적으로 어려웠기에, 표준에서는 이들을 서명 대상에서 제외했습니다.

<br/>

### Google Request Body Hash : 요청 본문의 무결성 확장

바로 위에서 언급된, application/x-www-form-urlencoded 외의 요청 본문은 서명 대상에서 제외되는 OAuth 1.0a의 한계를 극복하기 위해 'Google Request Body Hash'라는 확장이 등장합니다.

이 확장은 구글이 제안한 것으로, HMAC-SHA512와 같은 해시 알고리즘을 사용하여 요청 본문만을 해시합니다.

해시 값은 oauth_body_hash라는 새로운 OAuth 파라미터로 만들어집니다.

이 oauth_body_hash 파라미터가 바로 위에서 설명한 '정규화된 요청 파라미터 문자열'에 포함되어 최종 '서명 베이스 문자열'을 구성하게 됩니다.



## 서명 및 검증 프로세스 (매번 수행)

<br/>

클라이언트 (TLCM)

- HTTP 메서드, URL, 쿼리/폼/OAuth 파라미터 (요청 본문이 있다면 oauth_body_hash 포함)를 가지고 '서명 베이스 문자열'을 매번 새롭게 생성합니다
- 이 '서명 베이스 문자열'을 해시하고, API Signing Key(개인 키)로 서명하여 oauth_signature 값을 만듭니다.
- 이 서명 값과 다른 OAuth 파라미터를 Authorization 헤더에 담아 서버에 요청을 보냅니다.

<br/>

서버 (MasterCard)

- 클라이언트가 보낸 요청에서 HTTP 메서드, URL, 쿼리/폼/OAuth 파라미터를 추출하여 클라이언트와 동일한 방식으로 '서명 베이스 문자열'을 재구성합니다.
- 재구성된 문자열을 해시하고, API Signing Key에 해당하는 공개 키로 클라이언트의 oauth_signature를 복호화합니다.
- 두 해시 값이 일치하면 서명이 유효하고 요청이 변조되지 않았다고 판단하여 API 요청을 처리합니다.

OAuth 1.0a는 각 요청마다 복잡한 서명 과정을 거쳐야 합니다. 따라서 한 번 생성된 서명 값을 다음 요청에 재사용할 수 없습니다. 요청의 URL, 파라미터, 본문 심지어 타임스탬프와 논스(nonce)만 달라져도 서명 베이스 문자열이 바뀌고, 그에 따라 서명도 새로 생성해야 하기 때문입니다



## 복잡한 OAuth 1.0a 왜 아직 쓰는가?

"OAuth 2.0이 훨씬 간편하고 유연하다고 하는데, 왜 아직도 OAuth1.0a를 쓰는 곳이 있지?"

가장 큰 이유는 하위 호환성(Backward Compatibility) 때문입니다.

특히 금융권과 같이 보안이 중요하고 시스템 변경에 대한 부담이 큰 산업에서는 이미 오래전에 구축된 시스템들이 OAuth 1.0a 를 기반으로 작동하고 있는 경우가 많습니다.

새로운 인증 방식을 도입하려면 엄청난 규모의 시스템 개편과 테스트가 필요하기 때문에, 쉽사리 전환하지 못하는 것입니다.



## 왜 OAuth 2.0이 대세가 되었을까?

OAuth 1.0a는 매우 견고한 보안 메커니즘을 제공하지만, 앞서 살펴본 것처럼 복잡성이라는 큰 단점을 가지고 있습니다.

이러한 복잡성은 특히 모바일 앱이나 자바스크립트 기반의 프론트엔드 애플리케이션에서 구현하기에 큰 장벽이 되었습니다.

이러한 단점 때문에, 현대 웹 서비스의 표준은 OAuth 2.0으로 확고히 자리 잡았습니다.

OAuth 2.0 의 장점

- **단순성 및 사용 편의성:** OAuth 2.0은 OAuth 1.0a의 복잡했던 서명 과정을 없애고 , Access Token 이라는 개념을 중심으로 훨씬 단순하고 이해하기 쉬운 인증 흐름을 제공합니다.
- **유연성 및 확장성:** 다양한 '권한 부여 흐름(Grant Type)'을 제공하여 웹 애플리케이션, 모바일 앱, 데스크톱 앱 등 다양한 환경에 맞는 인증 방식을 지원합니다.
- **OpenID Connect와의 결합:** OAuth 2.0은 '권한 부여'에 초점을 맞추지만, 그 위에 구축된 OpenID Connect는 '인증(Authentication)' 기능을 표준화하여 소셜 로그인과 같은 사용자 인증 시나리오에 완벽하게 부합합니다.



## 맺으며

이번 TLCM 프로젝트를 통해 OAuth 1.0a라는, 언뜻 보면 낡아 보이는 기술을 깊이 있게 파고들 수 있었습니다.

oauth1-signer-java와 같은 라이브러리를 활용하면서도 그 내부 원리를 이해하기 위해 노력했습니다.

특히 Signature Base String의 구성 원리, Google Request Body Hash의 필요성, 그리고 복잡한 서명 및 정규화 과정이 어떻게 처리되는지 MasterCard API 문서와 OAuth1.0a 공식 문서를 꼼꼼히 분석하며 라이브러리 연동 과정을 거쳐
그 원리를 명확히 파악할 수 있었습니다.

OAuth 2.0이 훨씬 효율적이고 현대적인 방식임은 부인할 수 없습니다.

하지만 여전히 특정 도메인에서는 레거시 시스템과의 연동을 위해 OAuth 1.0a와 같은 오래된 기술을 이해하고 적용해야 하는 경우가 있습니다.

이러한 경험은 단순히 최신 기술 트렌드만을 쫓는 것이 아니라, 어떤 기술이든 그 핵심 원리를 파악하고 문제 해결에 적용하는 개발자의 자세를 다시 한번 생각하게 해주었습니다.
