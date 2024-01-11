---
date: '2023-01-06'
title: '도메인 주도 개발 , 리팩토링'
categories: ['항해플러스']
summary: '도메인 주도 개발'
thumbnail: './image.png'
---

주문 도메인에 주문 항목을 표현하는 OrderProduct 객체

```java
@Entity
@NoArgsConstructor
@Getter
public class OrderProduct{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "order_id")
    private Order order;
    private Long productId;
    private Long count;
    private Long price;

    @CreatedDate
    private LocalDateTime createdDate;

    @LastModifiedDate
    private LocalDateTime lastModifiedDate;

    // ... 생략
}

```

의미를 더 분명하게 하기 위해 이름을 OrderLine 으로 변경하였다.

또한, 구매 개수를 count 대신 quantity 로 변경하였다.

```java
@Entity
@NoArgsConstructor
@Getter
public class OrderLine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "order_id")
    private Order order;

    private Long productId;
    private Long quantity;
    private Long price;


    @CreatedDate
    private LocalDateTime createdDate;

    @LastModifiedDate
    private LocalDateTime lastModifiedDate;

    // .... 생략
}
```

## 주문 비즈니스 로직

OrderService 에서 createOrder 메서드로 주문을 생성한다.

여기서 코드를 개선 해보자

```java
@Service
@Slf4j
@RequiredArgsConstructor
public class OrderService {

    private final UserReader userReader;
    private final OrderAppender orderAppender;
    private final PointManager pointManager;
    private final StockManager stockManager;
    private final UserManager userManager;
    private final PaymentService paymentService;
    private final ApplicationEventPublisher publisher;


    @Transactional
    public OrderPostResponse createOrder(OrderPostRequest request) {
        User user = userReader.read(request.getUserId());
        // 재고 차감
        stockManager.deduct(request);
        // 주문
        Order savedOrder = orderAppender.append(user, request.getProducts(), timeProvider);
        // 잔액 차감
        userManager.deductPoint(user, savedOrder);
        // 포인트 내역 저장
        pointManager.process(user, savedOrder);

        // 결제
        paymentService.execute(savedOrder, user);
        publisher.publishEvent(new OrderEvent(this, savedOrder));
        return OrderPostResponse.of(savedOrder);
    }
}
```

### 재고 차감 행위

재고를 차감하는 행위를 StockManager 에서 수행한다.

상품은 Product 도메인이고, Product 도메인 안에 quantity 필드가 재고를 나타낸다.

그렇다면 StockManager 에서 재고를 차감하는 게 맞을까?

StockManager 가 아닌 ProductService 에게 재고 차감하는 역할을 위임하자

```java
@Service
@RequiredArgsConstructor
public class ProductService {

      private final ProductRepository productRepository;
      // .. 생략

     @Transactional
    public void deduct(OrderPostRequest request) {
        List<ProductRequestForOrder> productRequests = request.getProducts();
        Map<Long, Long> productIdQuntitiyMap = convertToProductIdQuantityMap(productRequests);
        List<Product> products = findProducts(productRequests);
        for (Product product : products) {
            Long quantity = productIdQuntitiyMap.get(product.getId());
            product.deductQuantity(quantity);
        }
        productRepository.saveAll(products);

    }

      private Map<Long, Long> convertToProductIdQuantityMap(List<ProductRequestForOrder> products) {
        return products.stream()
                .collect(Collectors.toMap(ProductRequestForOrder::getProductId, ProductRequestForOrder::getQuantity));
    }

    private List<Product> findProducts(List<ProductRequestForOrder> productRequests){
        return productRepository.findAllByPessimisticLock(productRequests.stream().map(ProductRequestForOrder::getProductId).collect(Collectors.toList()));
    }
}
```

### 잔액 차감 행위

UserManager 클래스에서 잔액 차감을 하고 있다.

UserManager 는 어떤 역할을 하는 지 이름도 모호하고 UserManager 클래스에서 도메인 로직을 구현하는 것은 옳지 않는 것 같다.

잔액 차감이라는 로직은 User 도메인이 이미 하고 있다.

```java
@Entity
@Table(name = "users")
@NoArgsConstructor
@Getter
public class User extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long id;
    private String name;

    private Long currentPoint;

    @Version
    private Long version;

    // .. 생략

    public void deductPoints(Long totalPrice) {
        if (this.currentPoint < totalPrice) {
            throw new UserException.InsufficientPointsException(INSUFFICIENT_POINT);
        }
        this.currentPoint -= totalPrice;
    }

    // .. 생략

}
```

잔액이 부족한지 여부도 체크해서 응집도를 높인 코드이다.

UserManager 라는 클래스를 따로 만들어서 비즈니스 로직을 괜히 복잡하게 할 필요가 없을 것 같다.

그리고 잔액 차감은 결제 하기 전에 하는 것으로 정했기 때문에

PaymentService execute 메서드에 파리미터로 넘긴 뒤에

```java
@Service
@RequiredArgsConstructor
public class PaymentService {
    private final PaymentRepository paymentRepository;

    public void execute(Order order , User user) {
        user.deductPoints(order.getTotalPrice());
        Payment payment = new Payment(order, user);
        paymentRepository.save(payment);
    }
}

```

User 도메인 로직을 수행하는 식으로 코드 수를 줄여 나갔다.
