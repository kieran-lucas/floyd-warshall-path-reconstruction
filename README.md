# Truy vết đường đi với Floyd–Warshall

[Mở bài học](https://kieran-lucas.github.io/floyd-warshall-path-reconstruction/) · [Phòng mô phỏng](https://kieran-lucas.github.io/floyd-warshall-path-reconstruction/laboratory.html)

Bài học gồm năm trang, dùng cùng một đồ thị có hướng bốn đỉnh.

1. [Từ một nguồn đến mọi cặp đỉnh](index.html) · Chạy Dijkstra từ nguồn 1 rồi xét câu hỏi khi nguồn đổi sang 2.
2. [Ma trận khoảng cách D](khoang-cach.html) · Theo dõi các ma trận qua bốn lượt Floyd và phép cập nhật 9 → 8 → 5.
3. [Ma trận bước kế tiếp N](buoc-ke-tiep.html) · Xem hoạt ảnh ghi và đọc ma trận, tiến lùi từng bước hoặc phát tự động.
4. [Ma trận P và M](cac-cach-truy-vet.html) · Lần ngược, tách đoạn và xử lý trường hợp có nhiều đường cùng trọng số.
5. [Cài đặt Java](cai-dat.html) · Mã nguồn đầy đủ, lệnh chạy và đầu ra để đối chiếu.

Phòng mô phỏng sáu đỉnh cho phép đổi nguồn và đích, xem tất cả các bước Floyd và liệt kê mọi đường ngắn nhất đơn.

## Chạy tại máy

Mở `index.html` hoặc phục vụ thư mục bằng máy chủ HTTP tĩnh. Để chạy [ví dụ Java](FloydWarshallPaths.java), dùng JDK 11 trở lên.

```sh
javac -encoding UTF-8 FloydWarshallPaths.java
java FloydWarshallPaths 1 4
```

## Kiểm thử thuật toán

```sh
node test-lesson.js
node test-matrix-lab.js
node test-all-paths.js
```

Bài kiểm thử trang đọc xác nhận các liên kết, số liệu ma trận và mã Java hiển thị. Hai bộ kiểm thử thuật toán đối chiếu kết quả với liệt kê vét cạn. Bộ thứ nhất còn kiểm tra các điều khiển và sáu ma trận dựng sẵn của phòng mô phỏng.
