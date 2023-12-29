---
date: '2023-12-23'
title: '항해 플러스 3주차 - TDD 코드 점진적으로 개선 리팩토링 하기  '
categories: ['항해플러스']
summary: 'e-커머스 상품 주문 서비스의 코드를 클린 코드, 객체지향적인 코드로 점진적으로 개선해나갔습니다.'
thumbnail: './img.png'
---

# 코드 점진적으로 개선하기

## 주문하기 코드

```java
@Service
@RequiredArgsConstructor
public class OrderService {

    private final UserReader userReader;
    private final ProductReader productReader;
    private final OrderAppender orderAppender;
    private final PointManager pointManager;
    private final StockManager stockManager;


    @Transactional
    public void createOrder(OrderPostRequest request) {
        User user = userReader.read(request.getUserId());
        // 상품 목록 가져 오기
        List<Product> products = productReader.read(request.getProducts());
        // key : 상품 id , value : 주문 수량
        Map<Long, Long> productIdQuntitiyMap = productReader.convertToProductIdQuantityMap(request.getProducts());
        // 재고 차감
        stockManager.deduct(products,stockMap);
        // 주문
        Order savedOrder = orderAppender.append(user, products);

        // 결제
        pointManager.process(user,savedOrder);
    }

}
```

### 개선

상품 목록 가져오는 것과 상품 주문 수량 map 으로 변환해주는 부분이 createOrder 비즈니스 로직에 있는 것이
맞을까??

또한 map으로 변환 해주는 convertToProductIdQuantityMap 메서드는 ProductReader 클래스에서 하는 것이 적절해 보이지 않는다. ProductReader 는 product 관련 정보를 repoitory에서 가져오는 클래스다.

위의 2개 기능은 StockManager 에서 사용하면 될 것 같다.

```java
@Component
@RequiredArgsConstructor
public class StockManager {


    public void deduct(List<Product> products ,  Map<Long, Long> stockMap) {
        for (Product product : products) {
            Long quantity = stockMap.get(product.getId());
            if (product.isLessThanQuantity(quantity)){
                throw new InsufficientStockException(INSUFFICIENT_STOCK);
            }
            product.deductQuantity(quantity);
        }
    }
}
```

기존에 변환된 파라미터 2개를 받아서 작업 하던 것을

```java
@Component
@RequiredArgsConstructor
public class StockManager {
    private final ProductReader productReader;

    public void deduct(List<Product> products ,  Map<Long, Long> stockMap) {
        for (Product product : products) {
            Long quantity = stockMap.get(product.getId());
            if (product.isLessThanQuantity(quantity)){
                throw new InsufficientStockException(INSUFFICIENT_STOCK);
            }
            product.deductQuantity(quantity);
        }
    }

    public void deduct(OrderPostRequest request) {
        List<ProductRequestForOrder> requestForOrders = request.getProducts();
        Map<Long, Long> productIdQuntitiyMap = convertToProductIdQuantityMap(requestForOrders);
        List<Product> products =   productReader.read(request.getProducts());
        for (Product product : products) {
            Long quantity = productIdQuntitiyMap.get(product.getId());
            if (product.isLessThanQuantity(quantity)){
                throw new InsufficientStockException(INSUFFICIENT_STOCK);
            }
            product.deductQuantity(quantity);
        }
        productRepository.saveAll(products);
    }

    private Map<Long, Long> convertToProductIdQuantityMap(List<ProductRequestForOrder> products) {
        return products.stream()
                .collect(Collectors.toMap(ProductRequestForOrder::getProductId, ProductRequestForOrder::getQuantity));
    }
}
```

ProductReader 클래스를 의존하여 Product 정보를 가져오고

map 으로 변환하는 기능은 private 메서드로 수정하였다.

### 문제

### 결과

주문에 해당하는
