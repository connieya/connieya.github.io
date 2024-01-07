---
date: '2023-12-23'
title: '항해 플러스 3주차 - e-커머스 주문 서비스 기능 추가 , TDD 코드 점진적으로 개선 리팩토링 하기  '
categories: ['항해플러스']
summary: 'e-커머스 상품 주문 서비스의 기능을 추가하고 코드를 클린 코드, 객체지향적인 코드로 점진적으로 개선하기'
thumbnail: '../2주차/img.png'
---

# 상위 상품 조회 기능 추가 , 코드 점진적으로 개선하기

- 최근 3일간 가장 많이 팔린 상위 상품 정보를 제공하는 기능 추가하기
- 테스트하기 좋은 코드,설계를 고민하고 개선하기

## 상위 상품 조회 기능 추가

최근 3일간 가장 많이 팔린 상품 정보는

주문한 상품 내역 정보가 있는 OrderProduct 엔티티에서 구하면 된다.

주문 번호와 상품 식별 번호 , 주문 한 상품 개수 , 주문 당시 상품 가격이
저장되어 있는 OrderProduct 엔티티

```java
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

    public OrderProduct(Order order, Long productId, Long count, Long price) {
        this.order = order;
        this.productId = productId;
        this.count = count;
        this.price = price;
    }
}
```

가장 많이 팔린 상품을 구하기 위해 productId 의 개수를 카운트해서 select 하기

최근 3일이라는 기준은 OrderProduct 에 있는 createdDate 를 기준으로 3일이라는 구간을 지정한다.

### OrderProductRepository 에 메서드 추가

가장 많이 팔린 상품 3개 조회

```java
public interface OrderProductRepository extends JpaRepository<OrderProduct,Long> {


    @Query("select new com.example.hanghaeplus.dto.orderproduct.OrderProductRankResponse(o.productId,p.name,count(o.productId)) " +
            "from OrderProduct o inner join Product p " +
            "on o.productId = p.id " +
            "where o.createdDate >= :startDate and o.createdDate < :endDate " +
            "group by o.productId  " +
            "order by count(o.productId) desc limit 3"
    )
    List<OrderProductRankResponse> findTop3RankProductsInLast3Days(@Param("startDate") LocalDateTime startDate , @Param("endDate") LocalDateTime endDate);

}
```

#### 시간 의존성 주입하기

```java
@Entity
@Table(name = "orders")
@Getter
@NoArgsConstructor
public class Order extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "order_id")
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    private Long totalPrice;


    @OneToMany(mappedBy = "order" ,cascade = CascadeType.ALL)
    private List<OrderProduct> product;


    @Builder
    private Order(User user, List<ProductRequestForOrder> products) {
        this.user = user;
        this.product = getOrderProducts(products);
        this.totalPrice = calculateTotalPrice(products);
    }


    private List<OrderProduct> getOrderProducts(List<ProductRequestForOrder> products) {
        return products.stream()
               .map(product -> new OrderProduct(this, product.getProductId(), product.getQuantity(), product.getPrice()))
                .collect(Collectors.toList());
    }

    private static long calculateTotalPrice(List<ProductRequestForOrder> products) {
        return products.stream()
                .mapToLong(product -> product.getPrice() * product.getQuantity())
                .sum();
    }

    public static Order create(User user, List<ProductRequestForOrder> products) {
        return new Order(user, products);
    }
}
```

Order 객체를 생성할 때 , OrderProduct 객체를 생성해서 DB 에 함께 영속화 시킨다.

createdDate 는 생성할 때 자동으로 생성된다. 그런데, '최근 3일' 이라는 기준이 있기 때문에

테스트를 위해서

FakeOrder 객체를 생성하였고,

```java
public class FakeOrder {
    public static Order create(User user , List<ProductRequestForOrder> products , LocalDateTime dateTime) {
        return new Order(user,products,dateTime);
    }
}
```

Order 엔티티에 아래 코드를 추가하였다.

```java
 public Order(User user, List<ProductRequestForOrder> products, LocalDateTime dateTime) {
        this.user = user;
        this.product = getOrderProducts(products ,dateTime);
        this.totalPrice = calculateTotalPrice(products);
    }

    private List<OrderProduct> getOrderProducts(List<ProductRequestForOrder> products, LocalDateTime dateTime) {
        return products.stream()
                .map(product -> new OrderProduct(this, product.getProductId(), product.getQuantity(), product.getPrice() ,dateTime,dateTime))
                .collect(Collectors.toList());
    }

```

### 테스트 코드 작성

상위 상품 조회를 위해 Test Fixture 를 사용하였다.

#### Test Fixture

> 테스트를 위해 원하는 상태로 고정시킨 일련의 객체

주문을 위한 상품을 등록하고 , 주문을 하는 사용자와 주문 하는 상품 수량을 통해 여러 개의 주문을 미리 만들었다.

이렇게 테스트를 위한 객체를 미리 만들어두면 각 테스트 메서드마다 사용할 수 있어
중복을 방지할 수 있다.

#### @BeforeAll vs @BeforeEach

- @BeforeAll : 테스트 클래스 전체 실행 전에 작업을 수행
- @BeforeEach : 테스트 메서드 실행 전에 작업을 수행

```java
@SpringBootTest
class OrderProductRepositoryTest {


    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private OrderProductRepository orderProductRepository;
    Product productOnion;
    Product productPotato;
    Product productCarrot;
    Product productMushroom;
    Product productSweetPotato;


    @BeforeEach
    void setUp() {
        User user = User.create("건희", 10000000L);

        userRepository.save(user);

        productOnion = Product.create("양파", 1000L, 300L);
        productPotato = Product.create("감자", 2000L, 300L);
        productCarrot = Product.create("당근", 3000L, 300L);
        productMushroom = Product.create("버섯", 5000L, 300L);
        productSweetPotato = Product.create("고구마", 2000L, 300L);

        productRepository.saveAll(List.of(productOnion, productPotato, productCarrot, productMushroom, productSweetPotato));

        // 주문 1
        ProductRequestForOrder request1_1 = ProductRequestForOrder.of(productOnion.getId(), 5L, productOnion.getPrice());
        ProductRequestForOrder request1_2 = ProductRequestForOrder.of(productPotato.getId(), 10L, productPotato.getPrice());
        ProductRequestForOrder request1_3 = ProductRequestForOrder.of(productCarrot.getId(), 5L, productCarrot.getPrice());

        List<ProductRequestForOrder> requests1 = List.of(request1_1, request1_2, request1_3);


        // 주문 2
        ProductRequestForOrder request2_1 = ProductRequestForOrder.of(productCarrot.getId(), 5L, productCarrot.getPrice());
        ProductRequestForOrder request2_2 = ProductRequestForOrder.of(productPotato.getId(), 5L, productPotato.getPrice());

        List<ProductRequestForOrder> requests2 = List.of(request2_1, request2_2);


        // 주문 3
        ProductRequestForOrder request3_1 = ProductRequestForOrder.of(productCarrot.getId(), 5L, productCarrot.getPrice());
        ProductRequestForOrder request3_2 = ProductRequestForOrder.of(productOnion.getId(), 5L, productOnion.getPrice());

        List<ProductRequestForOrder> requests3 = List.of(request3_1, request3_2);

        // 주문 4
        ProductRequestForOrder request4_1 = ProductRequestForOrder.of(productMushroom.getId(), 5L, productMushroom.getPrice());
        ProductRequestForOrder request4_2 = ProductRequestForOrder.of(productOnion.getId(), 5L, productOnion.getPrice());
        ProductRequestForOrder request4_3 = ProductRequestForOrder.of(productCarrot.getId(), 5L, productCarrot.getPrice());

        List<ProductRequestForOrder> requests4 = List.of(request4_1, request4_2, request4_3);

        // 주문 1  : 양파 ,감자 ,당근
        Order order1 = FakeOrder.create(user, requests1, LocalDateTime.now().minusDays(1).withHour(0).withMinute(0).withSecond(0)); // 1일 전에 주문
        // 주문 2 : 당근 ,감자
        Order order2 = FakeOrder.create(user, requests2, LocalDateTime.now().minusDays(2).withHour(0).withMinute(0).withSecond(0)); // 2일 전에 주문
        // 주문 3 : 당근 ,양파
        Order order3 = FakeOrder.create(user, requests3, LocalDateTime.now().minusDays(2).withHour(0).withMinute(0).withSecond(0)); // 2일 전에 주문
        // 주문 4 : 버섯 , 양파 ,당근
        Order order4 = FakeOrder.create(user, requests4, LocalDateTime.now().minusDays(3).withHour(0).withMinute(0).withSecond(0)); // 3일 전에 주문


        orderRepository.saveAll(List.of(order1, order2, order3, order4));
    }


    @DisplayName("최근 3일간 상위 상품 3개를 조회 한다.")
    @Test
    void findTop3ProductsInLast3Days() {
        // given   // when
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime threeDaysAgo = now.minusDays(2).withHour(0).withMinute(0).withSecond(0);
        LocalDateTime oneDaysAfter = now.plusDays(1).withHour(0).withMinute(0).withSecond(0);

        List<OrderProductRankResponse> top3RankProductsInLast3Days = orderProductRepository.findTop3RankProductsInLast3Days(threeDaysAgo.toLocalDate().atStartOfDay(), oneDaysAfter.toLocalDate().atStartOfDay());


        // 주문 4 제외 =>  주문 1 , 주문 2,  주문 3 :  당근 3 , 양파 2,  감자 2
        //then
        assertThat(top3RankProductsInLast3Days.get(0).getName()).isEqualTo("당근");
        assertThat(top3RankProductsInLast3Days.get(0).getOrderCount()).isEqualTo(3);
        assertThat(top3RankProductsInLast3Days.get(0).getProductId()).isEqualTo(3L);
    }
}

```

test fixture 를 사용하면 여러 테스트를 진행 한다고 했을 때, 객체를 매번 생성할 필요 없이 @BeforeEach 를 사용하여 생성 한 뒤 모든 테스트에 적용할 수 있다.

하지만 test fixture 의 단점도 존재한다.

1. 한 눈에 보기 힘들다.
   - 여러 테스트 코드를 작성 했을 때 생성한 객체를 보기 위해 화면을 위로 이동해야 한다.
2. 클래스안에서 모든 테스트가 서로 결합되어 버린다.
   - 모든 테스트에 공통으로 영향을 주기 때문에 test fixture 의 코드 하나만 변경해도 모든 테스트에 영향을 미친다.

그래서 test fixture 를 사용할 때는

- 각 테스트 입장에서 , 테스트 내용을 이해하는 데 문제가 없는가?
- test fixture 를 수정해도 모든 테스트에 영향을 주지 않는가?

위 2가지를 고려하는 것이 좋겠다.

### 의존성과 테스트

위의 코드는 DB에 데이터를 insert 하고 , 내가 작성한 쿼리 (최근 3일간 인기 상품) 가 잘 동작하는 지를 테스트 하였다.

그러면 이제 비즈니스 로직 부분에서 테스트를 진행해야 한다.

주문을 수행하는 컴포넌트 클래스

```java
@Component
@RequiredArgsConstructor
public class OrderAppender {

    private final OrderRepository orderRepository;

    @Transactional
    public Order append(User user, List<ProductRequestForOrder> products) {
        Order order = Order.create(user, products);
        return orderRepository.save(order);
    }

}
```

#### 문제

여기서 '최근 3일' 이라는 시간을 기준으로 테스트 하기 위해서

파라미터에 '시간'을 주입해줘야 한다.

뿐 만아니라, OrderAppender 를 의존하는

OrderService 의 createOrder 메서드에도 파라미터에 '시간'을 주입해줘야 한다.

```java
    @Transactional
    public void createOrder(OrderPostRequest request ) {
        User user = userReader.read(request.getUserId());
        // 재고 차감
        stockManager.deduct(request);
        // 주문
        Order savedOrder = orderAppender.append(user, request.getProducts());
        // 잔액 차감
        userManager.deductPoint(user, savedOrder);
        // 포인트 내역 저장
        pointManager.process(user, savedOrder);
    }
```

그리고 OrderService 를 의존하는 Controller layer 에서도 "시간"을 주입해줘야 한다.

코드의 많은 부분을 수정해줘야 한다. 테스트를 위해서는 이 방법 밖에 없는 것일까?

#### 시도

'시간' 을 주입하는 대신, TimeProvider 라는 인터페이스를 만들어서 인터페이스에 의존하게 하자

의존성 역전을 하게 하는 것이다.

```java
public interface TimeProvider {
   LocalDateTime getLocalDateTime();
}
```

테스트가 아닌 실제 비즈니스 로직에서는

```java
@Component
public class SystemTimeProvider implements TimeProvider {
    @Override
    public LocalDateTime getLocalDateTime() {
        return LocalDateTime.now();
    }
}
```

현재 시간을 넣어준다.

그리고 테스트를 진행 할 때는 현재 시간이 아닌 테스트 하고자 하는 시간을 받도록 구현하였다.

```java
@AllArgsConstructor
public class TestTimeProvider implements TimeProvider{
    private LocalDateTime localDateTime;
    @Override
    public LocalDateTime getLocalDateTime() {
        return localDateTime;
    }
}

```

## 코드 점진적으로 개선하기

### 주문하기 로직 관심사 분리, 응집도 높이기

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

        // 포인트 내역 저장
        pointManager.process(user,savedOrder);
    }

}
```

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

### 잔액과 총 가격 비교 , 잔액 차감 통합하기

```java
    @Transactional
    public void deductPoint(User user , Order order) {
        Long totalPrice = order.getTotalPrice();
        if (user.getCurrentPoint() < totalPrice){
            throw new InsufficientPointsException(INSUFFICIENT_POINT);
        }
        user.deductPoints(totalPrice);
    }

```

사용자의 현재 잔액과 주문 한 총 가격을 비교한 뒤에 사용자의 잔액을 차감한다.
하지만 요구사항이 추가되어 여러 기능을 추가적으로 개발했을 때

잔액 차감이라는 메서드를 사용한다고 했을 때, 비교하는 로직을 다시 사용해야한다.

```java
 public void deductPoints(Long totalPrice) {
    this.currentPoint -= totalPrice;
    }
```

```java
    public void deductPoints(Long totalPrice) {
        if (this.currentPoint < totalPrice){
            throw new InsufficientPointsException(INSUFFICIENT_POINT);
        }
        this.currentPoint -= totalPrice;
    }
```

잔액 차감하는 메서드 안에서 잔액과 가격을 비교하면 되지 않을까?

잔액 차감과 비교하는 로직을 통합하여 다른 기능에서 잔액 차감 메서드를 사용했을 때

코드의 중복을 줄일 수 있다.

```java
    @Transactional
    public void deductPoint(User user , Order order) {
        Long totalPrice = order.getTotalPrice();
        user.deductPoints(totalPrice);
    }
```

### 개선 해야 할 점

- 테스트 하기 좋은 설계에 대해 고민하기
- 단위 테스트 비중을 높이기
- 올바른 단위 테스트가 무엇인지 생각해보기
- Mockito 에 대해서 공부하기
