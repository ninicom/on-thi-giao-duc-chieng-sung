# Dữ liệu câu hỏi và tài liệu nguồn

`app/course.json` là đầu vào đầy đủ của ứng dụng, gồm các chủ đề và bài học. Mỗi câu nằm trong một bài và giữ ID ổn định để tiến độ cũ có thể nhận diện nó.

## Cấu trúc câu hỏi

```json
{
  "id": "e01-1-q100",
  "stem": "Câu hỏi đã được đối chiếu với nguồn chính thức",
  "choices": ["Phương án A", "Phương án B", "Phương án C", "Phương án D"],
  "answer": 0,
  "explanation": "Giải thích đáp án và điều kiện áp dụng đã kiểm tra.",
  "sourceId": "43/2019/QH14",
  "article": "Điều và khoản được viện dẫn",
  "sourceUrl": "URL công bố chính thức",
  "lessonId": "e01-1",
  "topicId": "e01",
  "group": "education"
}
```

Ví dụ trên chỉ minh họa định dạng, không phải một câu pháp luật thực tế. `group` dùng `general` hoặc `education`. `answer` là chỉ số từ 0 đến 3; không ghi chữ A–D vào trường này. Các phương án nhiễu cần đủ gần quy định để phân biệt chủ thể, thời hạn, phạm vi hoặc ngoại lệ, tránh lựa chọn vô lý khiến người học đoán bằng mẹo.

## Bài và chủ đề

Bài có `id`, `title`, `minutes`, `example`, `points`, `recallPrompt`, `recallAnswer`, `reading` và `questions`. Bài đọc mở rộng có `supplemental: true`; chúng xuất hiện trong chủ đề và ngân hàng nhưng không tăng số bài chính của lịch ban đầu. Chủ đề có `id`, `group`, `day`, `sourceIds` và `lessons`.

`app/schedule.ts` xếp các bài chính và tất cả mã câu vào lộ trình. Kiểm tra lịch sẽ phát hiện câu bị bỏ sót, trùng phân bố hoặc số bài chính vượt ngưỡng của ngày luyện đề. Khi thay đổi lịch, cần sửa cả tài liệu kế hoạch nếu phát hành lại.

## Nguồn

`app/sources.json` giữ `id`, `title`, `source_url`, `download_url`, `file`, `sha256`, số trang và nhóm. `file` là đường dẫn tương đối dưới `public/downloads/originals/`. Ứng dụng mở bản trong repository để người học có thể đọc ngoại tuyến; liên kết Trang nguồn vẫn mở nơi công bố chính thức.

Tính SHA256 của tệp mới bằng Node:

```bash
node --input-type=module -e "import fs from 'node:fs'; import crypto from 'node:crypto'; console.log(crypto.createHash('sha256').update(fs.readFileSync(process.argv[1])).digest('hex'));" public/downloads/originals/duong-dan-tep.pdf
```

`app/coverage.json` mô tả các nhóm điều và ID câu viện dẫn. Trạng thái có câu chỉ chứng minh đã có viện dẫn trong nhóm; nó không xác nhận đã hỏi mọi khoản của từng điều. Với văn bản sửa đổi, cần đối chiếu từng nội dung thay đổi với bản gốc.

## Những gì kiểm tra tự động xác nhận

- ID bài/câu không trùng, câu có bốn lựa chọn khác nhau và đáp án hợp lệ.
- Câu liên kết đúng bài, chủ đề, nhóm và nguồn có trong danh mục.
- SHA256 của 39 tệp gốc khớp manifest.
- Chấm đáp án, câu bỏ trống, hàng đợi câu sai và nộp bài lặp.
- Giới hạn chọn đáp án khi đã hết giờ; phân bố đề giữa các chủ đề.
- Tất cả câu truy cập được qua chế độ chưa luyện; lịch xếp mỗi câu đúng một lần.
- Nhóm lịch sử theo ngày Việt Nam.

Kiểm tra cấu trúc không tự chứng minh tính đúng pháp lý. Người biên soạn vẫn cần đọc nguyên văn, bản sửa đổi và điều khoản chuyển tiếp; ghi rõ bối cảnh trong đề khi một quy trình chỉ còn áp dụng cho hồ sơ cũ.
