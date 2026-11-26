# Floyd-Warshall · Truy vết đường đi ngắn nhất

[Đọc bài và thử minh họa](https://kieran-lucas.github.io/floyd-warshall-path-reconstruction/)

Một bài đọc liên tục bằng tiếng Việt. Cùng đồ thị sáu đỉnh được dùng để trình bày Floyd cổ điển, ma trận bước kế tiếp N và ma trận trung gian M. Mỗi phần có mã Java và minh họa ngay trong bài. Nhấp nguồn rồi đích trên đồ thị để xem từng bước truy vết. Khi xây dựng ma trận, bỏ chọn **Chỉ hiện bước giảm khoảng cách** để theo dõi cả 216 phép so sánh.

Mở `index.html` trực tiếp hoặc phục vụ thư mục bằng máy chủ HTTP tĩnh.

## Java

Hai chương trình độc lập được đặt ngay trong phần tương ứng của bài: [Next-Hop](FloydWarshallNextHop.java) và [Intermediate](FloydWarshallIntermediate.java).

```sh
javac -encoding UTF-8 FloydWarshallNextHop.java
java FloydWarshallNextHop 1 6

javac -encoding UTF-8 FloydWarshallIntermediate.java
java FloydWarshallIntermediate 1 6
```

Ví dụ trả về khoảng cách 14 và đường [1, 2, 3, 4, 5, 6] cho cả hai phương án.

## Kiểm thử

```sh
node test-lesson.js
node test-matrix-lab.js
node test-all-paths.js
```
