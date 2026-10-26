---
date: '2026-10-07'
title: 'Feature Flag는 배포 없이 기능을 켜는 스위치일까?'
summary: 'TBD 전환과 운영 중 플래그 변경을 겪으며 알게 된 Feature Flag의 역할, 카나리 배포와의 차이, 그리고 반영 지연을 정리했다.'
categories: ['study', 'feature-flag', 'deployment', 'tbd']
deploy: true
---

인턴 온보딩에서 Feature Flag라는 말을 처음 접했다. 카나리 배포를 함께 배우며, 익숙한 `if–else`가 운영 중인 서비스의 기능을 제어하는 데 쓰인다는 점이 신선했다.

정확히 말하면 `if–else`는 원래도 대부분 런타임에 실행된다. 내가 새롭게 느낀 것은 **코드를 다시 배포하지 않고도 분기 조건에 쓰이는 설정값을 바꿀 수 있다**는 점이었다. 이후 Trunk-Based Development(TBD)를 접하고, 운영에서 값의 반영을 기다려본 뒤에는 이 기술을 조금 다르게 보게 됐다.

## Feature Flag는 무엇을 분리할까?

Feature Flag는 기능의 실행 여부를 설정값으로 결정하는 방식이다. 예를 들어 새 로직과 기존 로직을 함께 배포하고, 플래그가 꺼져 있을 때는 기존 로직만 실행할 수 있다.

```ts
if (flags.isEnabled('new-flow')) {
  return newFlow()
}

return existingFlow()
```

이 예시는 개념을 설명하기 위한 코드이며 실제 업무 코드는 아니다. 핵심은 **코드가 배포된 시점과 기능이 사용자에게 공개되는 시점이 달라도 된다**는 것이다. 플래그를 내부 사용자에게만 켜거나, 점진적으로 적용 범위를 넓히거나, 문제가 생기면 다시 끌 수도 있다. 단, 설정을 런타임에 갱신할 수 있는 구조여야 재배포 없이 전환된다.

Feature Flag 자체는 AWS의 기술이 아니다. 오래전부터 사용된 개발·운영 패턴이고, AWS AppConfig는 이를 관리할 수 있는 서비스 중 하나다. GitHub도 2010년에 신규 기능의 베타 접근을 사용자별 Feature Flag로 제어했다고 기록했다.

## 카나리 배포와는 어떻게 다를까?

둘 다 변경 사항을 소수에게 먼저 적용해 위험을 줄일 수 있지만, 제어하는 대상이 다르다.

| | 카나리 배포 | Feature Flag |
| --- | --- | --- |
| 주로 제어하는 것 | 새 애플리케이션 버전으로 보내는 트래픽 | 배포된 코드 안에서 실행할 기능·로직 |
| 예시 | 트래픽 5%를 새 버전으로 전달 | 일부 사용자에게 새 기능을 활성화 |

서로 배타적인 방법도 아니다. Feature Flag로 일부 사용자에게만 새 기능을 켜서 *카나리 출시*를 할 수 있다. 그래서 카나리 배포와 Feature Flag를 함께 배우게 된 것이다.

## TBD에서는 왜 필요할까?

Feature Flag를 처음 접했을 때는 단순한 기능 스위치라고 생각했다. 이후 TBD를 공부하면서 이것이 브랜치 전략과도 연결된다는 것을 알았다.

TBD에서도 리뷰를 위한 짧은 작업 브랜치는 사용할 수 있다. 핵심은 여러 사람이 오래 유지하는 개발 브랜치에 변경 사항을 쌓아두기보다, 중심 브랜치에 자주 통합하는 것이다. 그런데 미완성 기능이 `main`에 들어가면 바로 사용자에게 노출되는 것 아닐까? **Feature Flag를 끈 상태로 코드를 통합해두면, 통합과 공개를 분리할 수 있다.** 물론 플래그가 꺼져 있다는 이유만으로 테스트를 생략할 수는 없다.

물론 장애 위험과 플래그가 늘어날 때의 코드 복잡도는 따로 관리해야 한다. 플래그마다 켜진 경로와 꺼진 경로를 고려해야 하고, 사용이 끝난 플래그를 그대로 두면 조건문과 테스트 부담이 쌓인다. `main`에 합치기 전 검증과 적절한 테스트 환경도 여전히 필요하다.

## 설정값 변경은 어떻게 서비스에 도달할까?

플래그를 관리하는 화면에서 `false`를 `true`로 바꾼다고 해서 모든 애플리케이션이 즉시 새 값을 읽는 것은 아니다. 구현에 따라 변경을 검토·승인하고, 설정을 배포한 뒤, 각 애플리케이션이 새 버전을 가져오는 단계를 거친다. 설정을 코드처럼 PR로 관리하는 방식이라면 변경 이력을 남기고 리뷰할 수 있지만, 그만큼 반영까지의 시간을 고려해야 한다.

AWS AppConfig를 사용하는 경우에도 설정을 어떤 속도로 배포할지 정하는 전략이 있고, 애플리케이션은 Agent나 API를 통해 변경된 설정을 가져온다. 따라서 관리 화면, 설정 저장소, AWS 서비스, 애플리케이션은 각각 다른 단계일 수 있다. 구체적인 흐름과 소요 시간은 시스템마다 다르다.

긴급하게 기능을 꺼야 한다면 **설정 변경을 요청한 시점부터 실제 반영이 확인될 때까지의 시간**을 운영 판단에 포함해야 한다.

## 왜 값을 바꿨는데 바로 반영되지 않았을까?

운영 중 플래그를 급하게 변경해야 했던 적이 있다. 값을 바꿨는데 바로 반영되지 않아 그 사이에 영향이 더 커지지 않을지 걱정했던 기억이 선명하다. 체감상 반영에는 1~2분 정도가 걸렸다.

AWS AppConfig를 사용하는 시스템이라면 지연이 생길 수 있는 지점은 여럿이다. 변경 승인과 배포 파이프라인, AppConfig의 배포 전략, 그리고 애플리케이션이 새 설정을 가져오는 주기다. AWS AppConfig Agent는 설정을 캐시하고 주기적으로 새 버전을 조회한다. AWS 문서에 제시된 Agent의 기본 폴링 간격은 45초다. 따라서 **운영 중 변경 가능하다는 말이 모든 요청에 몇 초 안에 반영된다는 뜻은 아니다.** 내가 겪은 1~2분이 어느 단계에서 발생했는지는 확인할 수 없었다.

더 중요한 것은 플래그가 뒤늦게 꺼져도 **이미 처리된 작업이 되돌아오지는 않는다**는 점이다. 플래그는 이후 요청이 지나갈 경로를 바꿀 수 있지만, 그 전에 발생한 영향은 별도로 확인하고 필요하다면 복구해야 한다. 또한 반영 중에는 인스턴스마다 잠시 다른 설정을 보고 있을 가능성도 고려해야 한다.

## 지금 이해한 Feature Flag

처음에는 “운영 중 `if–else`를 바꾸는 신기한 스위치”처럼 보였다. 지금은 **코드 통합, 배포, 기능 공개를 분리하는 수단**으로 이해한다. TBD와 함께 쓰면 미공개 코드를 `main`에 안전하게 통합하는 데 도움이 되고, 일부 사용자에게만 공개해 위험을 줄일 수도 있다.

하지만 스위치는 공짜가 아니다. 설정 변경이 실제 서비스에 전달되기까지 시간이 걸릴 수 있고, 오래 남은 플래그는 코드와 테스트를 복잡하게 만든다. 특히 긴급한 상황에서는 “끄면 즉시 안전해진다”라고 가정하지 말고 **변경 절차, 전파 시간, 반영 확인 방법, 이미 발생한 영향의 복구 방법**을 함께 생각해야 한다.

## 참고 자료

- [How we deploy new features — GitHub](https://github.blog/news-insights/how-we-deploy-new-features/)
- [Feature Toggles (aka Feature Flags) — Martin Fowler](https://martinfowler.com/articles/feature-toggles.html)
- [Short-Lived Feature Branches — Trunk Based Development](https://trunkbaseddevelopment.com/short-lived-feature-branches/)
- [Feature flags — Trunk Based Development](https://trunkbaseddevelopment.com/feature-flags/)
- [Use a canary deployment strategy — Google Cloud](https://docs.cloud.google.com/deploy/docs/deployment-strategies/canary)
- [What is AWS AppConfig? — AWS](https://docs.aws.amazon.com/appconfig/latest/userguide/)
- [Working with deployment strategies — AWS](https://docs.aws.amazon.com/appconfig/latest/userguide/appconfig-creating-deployment-strategy.html)
- [What is AWS AppConfig Agent? — AWS](https://docs.aws.amazon.com/appconfig/latest/userguide/appconfig-agent.html)
- [AWS AppConfig Agent `POLL_INTERVAL` — AWS](https://docs.aws.amazon.com/appconfig/latest/userguide/appconfig-integration-ec2.html)
