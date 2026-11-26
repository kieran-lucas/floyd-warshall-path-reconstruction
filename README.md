# Floyd–Warshall · Truy vết đường đi ngắn nhất

[Đọc bài và thử minh họa](https://kieran-lucas.github.io/floyd-warshall-path-reconstruction/)

Một bài đọc liên tục bằng tiếng Việt. Cùng đồ thị bốn đỉnh được dùng để trình bày Floyd cổ điển, ma trận bước kế tiếp N và ma trận trung gian M. Mỗi phần có mã Java và minh họa ngay trong bài. Nhấp nguồn rồi đích trên đồ thị để xem từng bước truy vết. Khi xây dựng ma trận, bỏ chọn **Chỉ xem bước cải thiện** để theo dõi cả 64 phép so sánh.

Mở `index.html` trực tiếp hoặc phục vụ thư mục bằng máy chủ HTTP tĩnh.

## Java

[Tải mã nguồn](FloydWarshallPaths.java), biên dịch rồi chạy với cặp đỉnh mong muốn.

```sh
javac -encoding UTF-8 FloydWarshallPaths.java
java FloydWarshallPaths 1 4
```

Ví dụ trả về khoảng cách 9 và đường [1, 2, 3, 4] cho cả hai phương án.

## Kiểm thử

```sh
node test-lesson.js
node test-matrix-lab.js
node test-all-paths.js
```
