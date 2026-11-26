# Truy vết đường đi với Floyd–Warshall

[Mở bài học tương tác](https://kieran-lucas.github.io/floyd-warshall-path-reconstruction/) · [Phòng mô phỏng](https://kieran-lucas.github.io/floyd-warshall-path-reconstruction/laboratory.html)

Bài học mở đầu bằng Dijkstra một nguồn và Floyd–Warshall cho mọi cặp đỉnh. Một đồ thị bốn đỉnh minh họa việc ghi rồi đọc ma trận bước kế tiếp (N), đỉnh liền trước (P) hoặc đỉnh trung gian (M). Có thể chuyển giai đoạn, tiến lùi từng bước hoặc phát tự động. Các giá trị trong mô phỏng được tính từ trọng số trên đồ thị.

Phòng mô phỏng cho phép chọn nguồn, đích và đồ thị sáu đỉnh, xem từng phép so sánh của Floyd và liệt kê mọi đường ngắn nhất đơn bằng tập bước kế tiếp hoặc các cạnh chặt.

## Chạy tại máy

Mở `index.html` hoặc phục vụ thư mục này bằng một máy chủ HTTP tĩnh. Trang dùng HTML, CSS và JavaScript thuần.

## Kiểm thử

```sh
node test-matrix-lab.js
node test-all-paths.js
```

Hai bộ kiểm thử đối chiếu kết quả với liệt kê vét cạn. Bộ thứ nhất còn kiểm tra các điều khiển và sáu ma trận dựng sẵn của phòng mô phỏng.
