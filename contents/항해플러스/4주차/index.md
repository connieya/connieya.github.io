---
date: '2023-12-30'
title: '항해 플러스 4주차 - 동시성 테스트  '
categories: ['항해플러스']
summary: 'e-커머스 상품 주문 서비스 중에 동시성 문제가 야기 되는 경우를 분석하고 테스트 코드를 작성해본다.'
# thumbnail: './img_7.png'
---

# TDD 기반 기능 구현 동시성 문제

e-커머스 상품 주문 서비스 기능에서 동시에 요청이 발생 했을 때 야기되는 문제를 생각해보고 테스트 코드를 작성 해본다.

## 재고 차감

여러 사용자가 동시에 주문을 요청할 때 , 상품의 재고 수량이 요청된 주문 만큼
잘 차감 되는지 확인을 해야 한다.

### 테스트 코드 작성

주문 요청을 동시에 처리하는 코드를 작성 하기 위해 `CompletableFuture` 클래스를 사용하였다.

https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/CompletableFuture.html

`CompletableFuture` 클래스는 Java 에서 비동기적 및 동시성 작ㅇ버을 처리하기 위한 클래스로 Future 와 CompletionStage 인터페이스를 구현하여 미래에 완료될
작어블 나타낸다.

```java
    void deductQuantityWithConcurrency() {
        // given
        User user1 = User.create("건희", 100000000L);
        User user2 = User.create("거니", 100000000L);
        User savedUser1 = userRepository.save(user1);
        User savedUser2 = userRepository.save(user2);

        Product product1 = Product.create("양파", 1000L, 30L);
        Product product2 = Product.create("감자", 2000L, 30L);
        Product product3 = Product.create("당근", 3000L, 30L);


        productRepository.saveAll(List.of(product1, product2, product3));


        ProductRequestForOrder request1 = ProductRequestForOrder.of(product1.getId(), 5L, product1.getPrice());
        ProductRequestForOrder request2 = ProductRequestForOrder.of(product2.getId(), 10L, product2.getPrice());
        ProductRequestForOrder request3 = ProductRequestForOrder.of(product3.getId(), 5L, product3.getPrice());


        ProductRequestForOrder request4 = ProductRequestForOrder.of(product1.getId(), 3L, product3.getPrice());
        ProductRequestForOrder request5 = ProductRequestForOrder.of(product2.getId(), 5L, product3.getPrice());
        ProductRequestForOrder request6 = ProductRequestForOrder.of(product3.getId(), 5L, product3.getPrice());


        List<ProductRequestForOrder> requests1 = List.of(request1, request2, request3);
        List<ProductRequestForOrder> requests2 = List.of(request4, request5, request6);


        OrderPostRequest orderPostRequest1 = OrderPostRequest.builder()
                .userId(savedUser1.getId())
                .products(requests1)
                .build();

        OrderPostRequest orderPostRequest2 = OrderPostRequest.builder()
                .userId(savedUser2.getId())
                .products(requests2)
                .build();


        // when
        CompletableFuture.allOf(
             CompletableFuture.runAsync(()-> orderService.createOrder(orderPostRequest1)),
             CompletableFuture.runAsync(()-> orderService.createOrder(orderPostRequest2))
        ).join();

        List<Product> products = productRepository.findAllById(List.of(product1.getId(), product2.getId(), product3.getId()));
        Product findProduct1 = products.get(0);
        Product findProduct2 = products.get(1);
        Product findProduct3 = products.get(2);
        //then
        assertThat(findProduct1.getQuantity()).isEqualTo(30L-5L-3L);
        assertThat(findProduct2.getQuantity()).isEqualTo(30L-10L-5L);
        assertThat(findProduct3.getQuantity()).isEqualTo(30L-5L-5L);
    }
```

- CompletableFuture allOf 메서드 : 여러 작업을 동시에 실행하고, 모든 작업 결과에 콜백을 실행한다.
- CompletableFuture runAsync 메서드 : 결과를 반환하는 작업을 비동기적으로 실행

결과

![Alt text](image.png)

#### 실패 케이스

- 양파 , 감자, 당근 모두 30개 있다.
- "건희" , "거니" 2명의 유저가 동시에 주문을 요청하였다.
- "건희" 유저는 양파 5개, 감자 10개 , 당근 5개를 주문, "거니" 유저는 양파 3개 감자 5개 , 당근 5개를 주문하였다.
- 동시에 주문을 했기 때문에 하나의 주문을 통해 차감된 재고 수량을 가져오는 것이 아니라 2개의 주문 모두 주문이 들어오기 전 재고 수량인 30개를 DB에서 select 했다.
- "거니" 유저가 "건희" 유저가 주문을 완료 이후 차감된 재고 25개에서 Select 한 것이 아니라 주문 전 수량 30개에서 select 했기 때문에 양파의 재고가 30개에서 건희 5개 , 거니 3개를 뺀 22개 아닌 27개 결과로 테스트에 실패한다.
