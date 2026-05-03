// 28 bài học chia 4 giai đoạn:
//  Giai đoạn 1 (1-7):  NHẬN THỨC & CẮT NGUỒN GÂY HẠI
//  Giai đoạn 2 (8-14): XÂY NỀN TẢNG ĂN UỐNG
//  Giai đoạn 3 (15-21): TĂNG CHUYỂN HÓA
//  Giai đoạn 4 (22-28): ỔN ĐỊNH & DUY TRÌ

const LESSONS = [
  // ===================== GIAI ĐOẠN 1 =====================
  {
    day: 1,
    title: "Mỡ máu là gì – vì sao nguy hiểm",
    subtitle: "Giai đoạn 1 · Bắt đầu bằng việc hiểu rõ kẻ thù",
    body: `
      <h3>Mỡ máu (lipid máu) là gì?</h3>
      <p>Là <strong>chất béo lưu thông trong máu</strong>, gồm cholesterol và triglyceride. Cơ thể cần chúng để tạo màng tế bào, hormone và năng lượng. Nhưng khi vượt ngưỡng, mỡ thừa <strong>bám vào thành mạch</strong> tạo mảng xơ vữa.</p>
      <h3>Vì sao mỡ máu cao nguy hiểm?</h3>
      <ul>
        <li>Gây <strong>xơ vữa động mạch</strong>, hẹp lòng mạch</li>
        <li>Tăng nguy cơ <strong>nhồi máu cơ tim, đột quỵ</strong></li>
        <li>Dẫn đến <strong>gan nhiễm mỡ</strong>, viêm tụy</li>
        <li>Thường <strong>không có triệu chứng</strong> cho đến khi biến chứng nặng</li>
      </ul>
      <div class="callout">
        <strong>📝 Bài tập hôm nay:</strong> Viết ra giấy <strong>3 lý do bạn muốn thay đổi</strong> để giảm mỡ máu. Đây là động lực sẽ kéo bạn đi tiếp khi gặp khó khăn. Ví dụ: "Vì con tôi", "Vì tôi không muốn phụ thuộc thuốc", "Vì tôi muốn sống khỏe đến 80 tuổi".
      </div>
    `
  },
  {
    day: 2,
    title: "Thủ phạm làm mỡ máu tăng",
    subtitle: "Giai đoạn 1 · Nhận diện kẻ thù để biết cách đối phó",
    body: `
      <h3>5 thủ phạm hàng đầu</h3>
      <ol>
        <li><strong>Đường và tinh bột tinh luyện</strong>: nước ngọt, bánh ngọt, cơm trắng nhiều</li>
        <li><strong>Chất béo xấu</strong>: mỡ động vật, đồ chiên rán, thức ăn nhanh</li>
        <li><strong>Lười vận động</strong>: ngồi nhiều, ít đi bộ</li>
        <li><strong>Rượu bia, thuốc lá</strong>: tăng triglyceride, hạ HDL</li>
        <li><strong>Ngủ kém, stress kéo dài</strong>: rối loạn chuyển hóa</li>
      </ol>
      <p>Mỡ máu cao không phải do "ăn nhiều dầu mỡ" như nhiều người nghĩ — nó là <strong>tổng thể lối sống</strong>.</p>
      <div class="callout">
        <strong>📝 Bài tập hôm nay:</strong> Liệt kê <strong>3 thói quen xấu</strong> của bản thân đang khiến mỡ máu tăng. Hãy thành thật. Ví dụ: "Ăn cơm chan canh thật nhiều", "Uống 2 lon bia/ngày", "Ngồi máy tính không đứng dậy".
      </div>
    `
  },
  {
    day: 3,
    title: "Đọc hiểu chỉ số mỡ máu",
    subtitle: "Giai đoạn 1 · Đọc phiếu xét nghiệm như chuyên gia",
    body: `
      <h3>Bộ xét nghiệm lipid máu cơ bản</h3>
      <ul>
        <li><strong>Cholesterol toàn phần</strong>: bình thường &lt; 200 mg/dL</li>
        <li><strong>LDL-C (xấu)</strong>: &lt; 100 mg/dL</li>
        <li><strong>HDL-C (tốt)</strong>: &gt; 40 (nam) / 50 (nữ) mg/dL — càng cao càng tốt</li>
        <li><strong>Triglyceride</strong>: &lt; 150 mg/dL</li>
      </ul>
      <h3>Cách quy đổi đơn vị</h3>
      <p>1 mmol/L (cholesterol/LDL/HDL) ≈ 38.67 mg/dL · 1 mmol/L (triglyceride) ≈ 88.57 mg/dL.</p>
      <h3>Lưu ý khi xét nghiệm</h3>
      <ul>
        <li>Nhịn ăn 9–12 giờ trước, có thể uống nước lọc</li>
        <li>Không uống rượu 24 giờ trước</li>
      </ul>
      <div class="callout">
        <strong>📝 Bài tập hôm nay:</strong> Lấy phiếu xét nghiệm gần nhất (nếu có) và <strong>ghi lại 4 chỉ số</strong>: Cholesterol toàn phần – LDL – HDL – Triglyceride. Nếu chưa từng xét nghiệm, đặt mục tiêu đi xét nghiệm trong 7 ngày tới.
      </div>
    `
  },
  {
    day: 4,
    title: "Sai lầm ăn uống phổ biến",
    subtitle: "Giai đoạn 1 · Những lỗi nhỏ tích tụ thành mỡ máu cao",
    body: `
      <h3>5 sai lầm phần lớn người Việt mắc</h3>
      <ol>
        <li><strong>Ăn quá nhiều cơm trắng</strong> – đẩy đường huyết và triglyceride lên cao</li>
        <li><strong>Bữa nào cũng có món chiên</strong> – thấm dầu, nhiều calo</li>
        <li><strong>Ăn vặt, đồ ngọt giữa các bữa</strong> – tổng calo dư thừa</li>
        <li><strong>Ăn khuya sau 21h</strong> – cơ thể không kịp chuyển hóa, mỡ tích lại</li>
        <li><strong>Bỏ bữa rồi ăn bù</strong> – gây tăng đột biến đường huyết</li>
      </ol>
      <p>Mỗi sai lầm tự nó nhỏ, nhưng <strong>cộng dồn 365 ngày</strong> sẽ là vấn đề lớn.</p>
      <div class="callout">
        <strong>📸 Bài tập hôm nay:</strong> Chụp lại <strong>toàn bộ bữa ăn trong ngày</strong> (sáng, trưa, tối, ăn vặt). Mục đích: nhìn lại khách quan để biết mình thật sự ăn gì.
      </div>
    `
  },
  {
    day: 5,
    title: "Vai trò của nước",
    subtitle: "Giai đoạn 1 · Chất xúc tác bị bỏ quên",
    body: `
      <h3>Nước có liên quan gì đến mỡ máu?</h3>
      <ul>
        <li>Hỗ trợ <strong>thận đào thải</strong> mỡ thừa và độc tố</li>
        <li>Giúp <strong>chuyển hóa chất béo</strong> diễn ra trơn tru</li>
        <li>Giảm cảm giác đói giả – chống ăn vặt</li>
        <li>Cải thiện độ nhớt của máu, hỗ trợ tuần hoàn</li>
      </ul>
      <h3>Lượng nước cần mỗi ngày</h3>
      <p>Khoảng <strong>30–40 ml × cân nặng (kg)</strong>. Người 60 kg ≈ 1.8–2.4 lít/ngày. Khi vận động, nóng bức cần thêm.</p>
      <h3>Mẹo uống đủ nước</h3>
      <ul>
        <li>Đặt bình 1.5–2 lít trên bàn làm việc</li>
        <li>Uống 1 cốc khi mới thức dậy</li>
        <li>Uống trước bữa ăn 30 phút (giúp ăn ít hơn)</li>
      </ul>
      <div class="callout">
        <strong>💧 Bài tập hôm nay:</strong> <strong>Uống đủ 1.5–2 lít nước</strong> trong ngày và ghi lại số ly đã uống. Có thể đánh dấu trên bình hoặc dùng app.
      </div>
    `
  },
  {
    day: 6,
    title: "Tại sao phải vận động",
    subtitle: "Giai đoạn 1 · Vận động – liều thuốc miễn phí",
    body: `
      <h3>Vận động ảnh hưởng mỡ máu thế nào?</h3>
      <ul>
        <li>Tăng <strong>HDL (cholesterol tốt)</strong> 5–10%</li>
        <li>Giảm <strong>triglyceride 20–30%</strong></li>
        <li>Đốt mỡ nội tạng – nguyên nhân hàng đầu của xơ vữa</li>
        <li>Cải thiện độ nhạy insulin, ổn định đường huyết</li>
        <li>Giảm stress, ngủ ngon hơn</li>
      </ul>
      <h3>Bắt đầu từ đâu?</h3>
      <p>Đi bộ là cách đơn giản nhất – không cần dụng cụ, ít chấn thương, ai cũng làm được. Cường độ vừa: <strong>nói được nhưng không hát được</strong>.</p>
      <div class="callout">
        <strong>🚶 Bài tập hôm nay:</strong> <strong>Đi bộ 15–20 phút</strong> ở tốc độ vừa phải (4–6 km/h). Có thể đi quanh khu phố, công viên, hoặc đi bộ sau bữa tối.
      </div>
    `
  },
  {
    day: 7,
    title: "Tổng kết tuần 1",
    subtitle: "Giai đoạn 1 · Hoàn thành 1/4 chặng đường",
    body: `
      <h3>Tuần 1 bạn đã học gì?</h3>
      <ul>
        <li>Mỡ máu là gì và vì sao nguy hiểm</li>
        <li>Nhận diện 5 thủ phạm khiến mỡ máu tăng</li>
        <li>Hiểu các chỉ số xét nghiệm</li>
        <li>Phát hiện sai lầm ăn uống của bản thân</li>
        <li>Vai trò của nước và vận động</li>
      </ul>
      <h3>Tự đánh giá – thang điểm 0 đến 10</h3>
      <p>Hãy chấm điểm trung thực cho 5 mục dưới đây:</p>
      <ol>
        <li>Mức độ hiểu kiến thức về mỡ máu</li>
        <li>Mức độ nhận thức về thói quen xấu của bản thân</li>
        <li>Lượng nước uống mỗi ngày</li>
        <li>Mức độ vận động</li>
        <li>Cảm nhận chung về sức khỏe</li>
      </ol>
      <p>Tổng điểm tối đa: 50. Mục tiêu cuối chương trình: nâng tổng điểm lên 40+.</p>
      <div class="callout">
        <strong>📊 Bài tập hôm nay:</strong> <strong>Đánh giá bản thân (0–10 điểm)</strong> cho 5 mục trên và ghi lại tổng điểm hiện tại. Sẽ so sánh ở ngày 14, 21, 28.
      </div>
    `
  },

  // ===================== GIAI ĐOẠN 2 =====================
  {
    day: 8,
    title: "Nguyên tắc \"đĩa ăn chuẩn\"",
    subtitle: "Giai đoạn 2 · Công thức đơn giản cho mỗi bữa ăn",
    body: `
      <h3>Đĩa ăn chuẩn – chia 3 phần</h3>
      <ul>
        <li><strong>½ đĩa: rau củ đa sắc</strong> – luộc, hấp, xào ít dầu</li>
        <li><strong>¼ đĩa: protein nạc</strong> – cá, đậu, thịt gia cầm bỏ da, trứng</li>
        <li><strong>¼ đĩa: tinh bột tốt</strong> – gạo lứt, yến mạch, khoai lang</li>
      </ul>
      <h3>Vì sao công thức này hiệu quả?</h3>
      <ul>
        <li>Tự nhiên ít calo nhưng no lâu</li>
        <li>Đủ chất xơ giảm hấp thu cholesterol</li>
        <li>Đủ protein để giữ cơ – không hao cơ khi giảm cân</li>
        <li>Ổn định đường huyết, không tăng triglyceride</li>
      </ul>
      <div class="callout">
        <strong>🍽 Bài tập hôm nay:</strong> Chuẩn bị <strong>1 bữa đúng chuẩn "đĩa ăn"</strong> (½ rau, ¼ đạm, ¼ tinh bột tốt). Có thể là trưa hoặc tối. Chụp lại để so sánh với bữa ăn ngày 4.
      </div>
    `
  },
  {
    day: 9,
    title: "Chất béo tốt – chất béo xấu",
    subtitle: "Giai đoạn 2 · Không phải mỡ nào cũng giống nhau",
    body: `
      <h3>Chất béo XẤU – cần hạn chế</h3>
      <ul>
        <li><strong>Chất béo bão hòa</strong>: mỡ động vật, da gà, nội tạng, bơ</li>
        <li><strong>Chất béo chuyển hóa (trans fat)</strong>: bánh ngọt công nghiệp, đồ chiên đi chiên lại, margarine</li>
      </ul>
      <h3>Chất béo TỐT – nên ăn</h3>
      <ul>
        <li><strong>Không bão hòa đơn</strong>: dầu ô liu, quả bơ, hạnh nhân</li>
        <li><strong>Không bão hòa đa</strong>: dầu đậu nành, hạt, cá béo</li>
        <li><strong>Omega-3</strong>: cá hồi, cá thu, hạt chia, hạt lanh</li>
      </ul>
      <h3>Mẹo đọc nhãn</h3>
      <p>Tránh sản phẩm có cụm <strong>"dầu thực vật hydro hóa một phần"</strong> — đó chính là trans fat trá hình.</p>
      <div class="callout">
        <strong>🚫 Bài tập hôm nay:</strong> <strong>Loại bỏ 1 món chiên</strong> trong các bữa ăn của bạn hôm nay. Thay bằng món luộc, hấp, áp chảo ít dầu, hoặc nướng.
      </div>
    `
  },
  {
    day: 10,
    title: "Chất xơ – vũ khí giảm mỡ máu",
    subtitle: "Giai đoạn 2 · Đơn giản nhưng cực kỳ mạnh mẽ",
    body: `
      <h3>Chất xơ hoạt động thế nào?</h3>
      <p><strong>Chất xơ hòa tan</strong> tạo gel trong ruột, giữ lại cholesterol và muối mật, khiến cơ thể phải lấy cholesterol trong máu để bù → giảm LDL.</p>
      <h3>Nguồn chất xơ tốt</h3>
      <ul>
        <li><strong>Yến mạch, lúa mạch</strong> – beta-glucan giảm LDL</li>
        <li><strong>Đậu các loại</strong> – đậu đen, đậu lăng, đậu đỏ</li>
        <li><strong>Rau lá xanh</strong> – cải bó xôi, cải xoăn, rau muống</li>
        <li><strong>Trái cây cả vỏ</strong> – táo, lê, ổi, việt quất</li>
        <li><strong>Hạt chia, hạt lanh</strong></li>
      </ul>
      <h3>Mục tiêu</h3>
      <p><strong>25–30 g chất xơ/ngày</strong>, trong đó 5–10 g là chất xơ hòa tan.</p>
      <div class="callout">
        <strong>🥦 Bài tập hôm nay:</strong> <strong>Thêm rau vào ít nhất 2 bữa</strong> hôm nay (sáng/trưa/tối). Ưu tiên rau lá xanh đậm, rau luộc/hấp.
      </div>
    `
  },
  {
    day: 11,
    title: "Đường và tinh bột xấu",
    subtitle: "Giai đoạn 2 · Cắt đường – giảm triglyceride nhanh chóng",
    body: `
      <h3>Đường tăng mỡ máu thế nào?</h3>
      <p>Đường (đặc biệt là <strong>fructose</strong> trong nước ngọt) được gan chuyển thành triglyceride. Một lon nước ngọt 330ml chứa ~35g đường — đã vượt giới hạn nữ/ngày.</p>
      <h3>Đường ẩn cần cảnh giác</h3>
      <ul>
        <li>Sữa chua có đường, sữa đặc</li>
        <li>Tương cà, sốt salad</li>
        <li>Bánh mì sandwich, bánh quy "ít béo"</li>
        <li>Trà sữa, cà phê đường</li>
      </ul>
      <h3>Tinh bột XẤU vs TỐT</h3>
      <ul>
        <li>Xấu: cơm trắng nhiều, bánh mì trắng, bún, phở (số lượng lớn)</li>
        <li>Tốt: gạo lứt, yến mạch, khoai lang, quinoa</li>
      </ul>
      <div class="callout">
        <strong>🥤 Bài tập hôm nay:</strong> <strong>Không uống nước ngọt, trà sữa hôm nay</strong>. Thay bằng nước lọc, trà xanh, nước chanh không đường.
      </div>
    `
  },
  {
    day: 12,
    title: "Protein đúng cách",
    subtitle: "Giai đoạn 2 · Đạm sạch – nguyên liệu giữ cơ, đốt mỡ",
    body: `
      <h3>Vì sao cần protein?</h3>
      <ul>
        <li>Giữ <strong>khối cơ</strong> – cơ giúp đốt mỡ ngay cả khi nghỉ ngơi</li>
        <li>No lâu, hạn chế ăn vặt</li>
        <li>Ổn định đường huyết</li>
      </ul>
      <h3>Nguồn đạm SẠCH</h3>
      <ul>
        <li><strong>Cá</strong>: cá hồi, cá thu, cá basa</li>
        <li><strong>Thịt gia cầm</strong> bỏ da</li>
        <li><strong>Trứng</strong>: 1–2 quả/ngày là an toàn</li>
        <li><strong>Đậu hũ, đậu lăng</strong>, các loại đậu</li>
        <li><strong>Sữa chua không đường</strong>, sữa tách béo</li>
      </ul>
      <h3>Hạn chế</h3>
      <p>Thịt đỏ chế biến (xúc xích, lạp xưởng), nội tạng, da gà chiên giòn — chứa nhiều mỡ bão hòa và muối.</p>
      <p>Lượng đạm khuyến nghị: <strong>1–1.2 g/kg cân nặng/ngày</strong>. Người 60 kg ≈ 60–72 g protein/ngày.</p>
      <div class="callout">
        <strong>🍳 Bài tập hôm nay:</strong> <strong>Ăn đủ đạm sạch</strong> trong cả 3 bữa. Mỗi bữa nên có 1 nguồn đạm: trứng/đậu/cá/gà bỏ da/sữa chua không đường.
      </div>
    `
  },
  {
    day: 13,
    title: "Omega 3 tự nhiên",
    subtitle: "Giai đoạn 2 · Vũ khí giảm triglyceride hàng đầu",
    body: `
      <h3>Omega-3 là gì?</h3>
      <p>Là acid béo không bão hòa thiết yếu, cơ thể không tự tạo được. Có 3 loại chính: <strong>EPA, DHA</strong> (từ cá) và <strong>ALA</strong> (từ thực vật).</p>
      <h3>Lợi ích</h3>
      <ul>
        <li>Giảm <strong>triglyceride 20–30%</strong></li>
        <li>Tăng nhẹ HDL</li>
        <li>Chống viêm, bảo vệ tim mạch</li>
        <li>Hỗ trợ não bộ và mắt</li>
      </ul>
      <h3>Nguồn omega-3</h3>
      <ul>
        <li><strong>Cá béo</strong>: cá hồi, cá thu, cá trích, cá mòi (2–3 lần/tuần)</li>
        <li><strong>Hạt lanh, hạt chia</strong>: 1 muỗng/ngày</li>
        <li><strong>Quả óc chó</strong>: 1 nắm nhỏ/ngày</li>
        <li><strong>Viên dầu cá</strong>: nếu không ăn được cá, tham khảo dược sĩ</li>
      </ul>
      <div class="callout">
        <strong>🐟 Bài tập hôm nay:</strong> <strong>Ăn cá béo</strong> trong bữa chính, hoặc bổ sung 1 muỗng hạt chia/hạt lanh vào bữa sáng. Nếu không có, dùng 1 viên dầu cá omega-3.
      </div>
    `
  },
  {
    day: 14,
    title: "Tổng kết tuần 2",
    subtitle: "Giai đoạn 2 · Đã hoàn thành ½ chương trình!",
    body: `
      <h3>Tuần 2 bạn đã học gì?</h3>
      <ul>
        <li>Đĩa ăn chuẩn ½ rau – ¼ đạm – ¼ tinh bột tốt</li>
        <li>Phân biệt chất béo tốt và xấu</li>
        <li>Vai trò của chất xơ trong giảm mỡ máu</li>
        <li>Cắt đường và tinh bột tinh luyện</li>
        <li>Ăn đủ protein sạch</li>
        <li>Bổ sung omega-3 từ cá và hạt</li>
      </ul>
      <h3>Đo lường sự thay đổi</h3>
      <p>Hãy nhìn lại bữa ăn ngày 4 và bữa ăn ngày 8. So sánh:</p>
      <ul>
        <li>Lượng rau: tăng/giảm?</li>
        <li>Số món chiên: bao nhiêu so với 10 ngày trước?</li>
        <li>Đồ ngọt, nước ngọt: cắt được bao nhiêu?</li>
        <li>Cảm nhận cơ thể: nhẹ hơn, đỡ uể oải hơn?</li>
      </ul>
      <div class="callout">
        <strong>🔍 Bài tập hôm nay:</strong> <strong>So sánh trước – sau</strong>. Viết ra (hoặc ghi nhận trong đầu) ít nhất 3 điểm khác biệt giữa cách ăn của bạn ngày 1 và hôm nay.
      </div>
    `
  },

  // ===================== GIAI ĐOẠN 3 =====================
  {
    day: 15,
    title: "Đi bộ đúng cách",
    subtitle: "Giai đoạn 3 · Đơn giản nhất nhưng hiệu quả nhất",
    body: `
      <h3>Đi bộ – bài tập phù hợp với mọi người</h3>
      <ul>
        <li>Không cần dụng cụ, miễn phí</li>
        <li>Ít chấn thương khớp</li>
        <li>Phù hợp mọi lứa tuổi, kể cả người tăng huyết áp</li>
        <li>10.000 bước/ngày giảm 10% nguy cơ tim mạch</li>
      </ul>
      <h3>Đi bộ đúng kỹ thuật</h3>
      <ul>
        <li><strong>Tốc độ</strong>: 5–6 km/h (đủ nhanh để hơi thở mạnh)</li>
        <li><strong>Tư thế</strong>: lưng thẳng, vai thư giãn, mắt nhìn về trước</li>
        <li><strong>Sải chân tự nhiên</strong>, vung tay nhịp nhàng</li>
        <li><strong>Bước chân tiếp đất bằng gót</strong>, đẩy bằng mũi</li>
        <li>Nhịp tim mục tiêu = (220 − tuổi) × 50–70%</li>
      </ul>
      <div class="callout">
        <strong>🚶 Bài tập hôm nay:</strong> <strong>Đi bộ 20–30 phút</strong> ở tốc độ vừa nhanh. Có thể chia 2 lần (10 phút sáng + 15–20 phút sau bữa tối).
      </div>
    `
  },
  {
    day: 16,
    title: "Đốt mỡ qua vận động nhẹ",
    subtitle: "Giai đoạn 3 · Tăng cường độ một chút mỗi ngày",
    body: `
      <h3>Sau đi bộ thì nâng cấp lên gì?</h3>
      <ul>
        <li><strong>Đi bộ nhanh xen kẽ chạy chậm</strong>: 1 phút chạy – 2 phút đi</li>
        <li><strong>Leo cầu thang</strong>: 5–10 phút thay thang máy</li>
        <li><strong>Bài tập tại chỗ</strong>: squat, plank, đẩy tường — 3 hiệp × 10 lần</li>
        <li><strong>Đạp xe, bơi lội</strong> nếu có điều kiện</li>
      </ul>
      <h3>Quy tắc "thêm 10 phút"</h3>
      <p>Mỗi tuần thêm 10 phút vào tổng vận động. Nếu tuần này 150 phút, tuần sau 160 phút. Cơ thể thích nghi từ từ, không sốc.</p>
      <h3>Vận động vi mô (NEAT)</h3>
      <ul>
        <li>Đứng dậy mỗi 45–60 phút khi làm việc</li>
        <li>Đi cầu thang thay thang máy</li>
        <li>Đỗ xe xa lối vào 5–10 phút</li>
      </ul>
      <div class="callout">
        <strong>💪 Bài tập hôm nay:</strong> <strong>Tập thêm 10 phút</strong> ngoài thời gian đi bộ. Có thể là 5 phút squat + 5 phút plank/đứng tường, hoặc leo cầu thang.
      </div>
    `
  },
  {
    day: 17,
    title: "Ngủ và mỡ máu",
    subtitle: "Giai đoạn 3 · Ngủ kém = mỡ máu kém",
    body: `
      <h3>Ngủ liên quan thế nào đến mỡ máu?</h3>
      <ul>
        <li>Ngủ &lt; 6 giờ: tăng LDL, triglyceride, giảm HDL</li>
        <li>Tăng cortisol → tăng đường huyết và mỡ nội tạng</li>
        <li>Mất kiểm soát ăn uống – thèm đồ ngọt vào hôm sau</li>
        <li>Giảm chuyển hóa, dễ tăng cân</li>
      </ul>
      <h3>Ngủ trước 23h – vì sao?</h3>
      <p>Từ 23h–3h là khoảng giờ <strong>gan phục hồi và xử lý mỡ</strong>. Thức khuya làm gián đoạn quá trình này, dẫn đến gan nhiễm mỡ và mỡ máu cao.</p>
      <h3>Vệ sinh giấc ngủ</h3>
      <ul>
        <li>Tắt màn hình ≥ 60 phút trước khi ngủ</li>
        <li>Phòng tối, mát (20–24°C)</li>
        <li>Không cà phê sau 14h</li>
        <li>Không ăn no trước khi ngủ 2–3 giờ</li>
      </ul>
      <div class="callout">
        <strong>😴 Bài tập hôm nay:</strong> <strong>Ngủ trước 23h</strong>. Đặt báo thức "đi ngủ" lúc 22h30 để tự nhắc. Đặt điện thoại xa giường.
      </div>
    `
  },
  {
    day: 18,
    title: "Stress làm tăng mỡ máu",
    subtitle: "Giai đoạn 3 · Quản lý stress = quản lý sức khỏe",
    body: `
      <h3>Stress mãn tính ảnh hưởng thế nào?</h3>
      <p>Stress kéo dài làm cortisol tăng → tăng đường huyết, tăng triglyceride, tích mỡ vùng bụng. Đồng thời kích thích ăn uống vô độ (đặc biệt là đồ ngọt, đồ chiên).</p>
      <h3>5 kỹ thuật thư giãn nhanh</h3>
      <ol>
        <li><strong>Thở 4-7-8</strong>: hít 4s – giữ 7s – thở 8s, lặp 4 lần</li>
        <li><strong>Quét cơ thể</strong>: nhắm mắt, thư giãn từng phần từ đầu đến chân</strong></li>
        <li><strong>Đi bộ trong thiên nhiên</strong>: công viên, đường có cây xanh</li>
        <li><strong>Viết nhật ký biết ơn</strong>: mỗi tối ghi 3 điều biết ơn</li>
        <li><strong>Nghe nhạc thư giãn</strong>: 5–10 phút</li>
      </ol>
      <h3>Cắt nguồn stress</h3>
      <ul>
        <li>Giới hạn mạng xã hội 30–60 phút/ngày</li>
        <li>Tắt thông báo điện thoại khi ngủ</li>
        <li>Học cách nói "không" với việc không cần thiết</li>
      </ul>
      <div class="callout">
        <strong>🧘 Bài tập hôm nay:</strong> <strong>Thực hành thư giãn 5 phút</strong>. Chọn 1 trong 5 kỹ thuật trên. Có thể trước khi ngủ hoặc giữa giờ làm việc.
      </div>
    `
  },
  {
    day: 19,
    title: "Thói quen buổi sáng",
    subtitle: "Giai đoạn 3 · Khởi đầu ngày mới đúng cách",
    body: `
      <h3>Buổi sáng quyết định cả ngày</h3>
      <p>Cách bạn bắt đầu ngày ảnh hưởng đến lựa chọn ăn uống, năng lượng và tâm trạng cả ngày.</p>
      <h3>Thói quen buổi sáng lý tưởng</h3>
      <ol>
        <li><strong>Uống 1 ly nước ấm ngay khi thức dậy</strong> (có thể vắt thêm chanh)</li>
        <li><strong>Vận động nhẹ 5–10 phút</strong>: giãn cơ, vươn vai, đi bộ trong nhà</li>
        <li><strong>Ăn sáng đủ chất</strong>: protein + chất xơ + tinh bột tốt</li>
        <li><strong>Tránh ăn ngay đồ ngọt</strong>: bánh ngọt, ngũ cốc đường gây tăng đường huyết đột ngột</li>
        <li><strong>Phơi nắng sáng 5 phút</strong>: kích hoạt vitamin D, ổn định nhịp sinh học</li>
      </ol>
      <h3>3 bữa sáng mẫu</h3>
      <ul>
        <li>Yến mạch + chuối + hạt chia + sữa hạnh nhân</li>
        <li>Trứng luộc + bánh mì nguyên cám + quả bơ</li>
        <li>Sữa chua không đường + việt quất + óc chó</li>
      </ul>
      <div class="callout">
        <strong>🌅 Bài tập hôm nay:</strong> <strong>Uống 1 ly nước ấm + vận động nhẹ 5 phút</strong> ngay khi thức dậy. Tạo cảm giác "ngày mới đã bắt đầu nhẹ nhàng".
      </div>
    `
  },
  {
    day: 20,
    title: "Thói quen buổi tối",
    subtitle: "Giai đoạn 3 · Kết thúc ngày để cơ thể nghỉ ngơi tốt",
    body: `
      <h3>Vì sao không nên ăn sau 20h?</h3>
      <ul>
        <li>Cơ thể chuyển sang chế độ nghỉ – ít chuyển hóa calo</li>
        <li>Mỡ thừa từ bữa khuya tích vào bụng và gan</li>
        <li>Gây trào ngược, ngủ không sâu</li>
        <li>Tăng đường huyết qua đêm – ảnh hưởng đến lipid sáng hôm sau</li>
      </ul>
      <h3>Thói quen buổi tối tốt</h3>
      <ol>
        <li><strong>Bữa tối nhẹ trước 19h</strong>: rau + đạm + ít tinh bột</li>
        <li><strong>Đi bộ 10–15 phút sau bữa</strong>: hỗ trợ tiêu hóa, hạ đường huyết</li>
        <li><strong>Tắt màn hình 1 giờ trước ngủ</strong></li>
        <li><strong>Đọc sách / thiền / nghe nhạc thư giãn</strong></li>
        <li><strong>Ngủ trước 23h</strong></li>
      </ol>
      <h3>Khi đói buổi tối – ăn gì?</h3>
      <p>Nếu thật sự đói: 1 quả táo, vài hạt hạnh nhân, hoặc 1 hũ sữa chua không đường. Tránh bánh kẹo, mì gói.</p>
      <div class="callout">
        <strong>🌙 Bài tập hôm nay:</strong> <strong>Không ăn sau 20h</strong>. Nếu đói chỉ uống nước, trà thảo mộc. Đi ngủ với cảm giác hơi đói nhẹ là OK.
      </div>
    `
  },
  {
    day: 21,
    title: "Tổng kết tuần 3",
    subtitle: "Giai đoạn 3 · Đã đi 3/4 chặng đường!",
    body: `
      <h3>Tuần 3 bạn đã làm được gì?</h3>
      <ul>
        <li>Đi bộ 20–30 phút mỗi ngày</li>
        <li>Tăng vận động nhẹ thêm 10 phút</li>
        <li>Ngủ trước 23h</li>
        <li>Thực hành thư giãn để giảm stress</li>
        <li>Xây dựng thói quen sáng và tối lành mạnh</li>
      </ul>
      <h3>Cảm nhận năng lượng cơ thể</h3>
      <p>Hãy tự hỏi mình:</p>
      <ul>
        <li>Sáng dậy có tỉnh táo hơn không?</li>
        <li>Có còn cảm giác mệt mỏi sau bữa trưa?</li>
        <li>Tâm trạng có ổn định hơn?</li>
        <li>Quần áo có rộng hơn (hoặc cảm giác nhẹ vùng bụng)?</li>
        <li>Đi bộ có đỡ thở dốc không?</li>
      </ul>
      <p>Nếu có ít nhất <strong>3/5 dấu hiệu cải thiện</strong>, bạn đang đi đúng hướng.</p>
      <div class="callout">
        <strong>⚡ Bài tập hôm nay:</strong> <strong>Đánh giá năng lượng cơ thể</strong>. Cho điểm 1–10 cho mỗi câu hỏi trên. Ghi lại để so sánh ngày 28.
      </div>
    `
  },

  // ===================== GIAI ĐOẠN 4 =====================
  {
    day: 22,
    title: "Tư duy lâu dài",
    subtitle: "Giai đoạn 4 · Sức khỏe là marathon, không phải nước rút",
    body: `
      <h3>Vì sao 28 ngày chưa đủ?</h3>
      <p>28 ngày giúp bạn xây nền tảng và phá thói quen cũ. Nhưng để mỡ máu thật sự ổn định và không tái phát, cần <strong>duy trì lối sống mới ít nhất 3–6 tháng</strong>.</p>
      <h3>3 nguyên tắc tư duy dài hạn</h3>
      <ol>
        <li><strong>Quy tắc 80/20</strong>: 80% bữa ăn lành mạnh, 20% linh hoạt (cho dịp đặc biệt)</li>
        <li><strong>Không tất cả hoặc không gì</strong>: bỏ tập 1 ngày không phải thất bại — chỉ cần tập lại ngày mai</li>
        <li><strong>Tập trung vào hệ thống, không phải mục tiêu</strong>: thay vì "tôi phải giảm 5kg", hãy "tôi đi bộ 30 phút mỗi ngày"</li>
      </ol>
      <h3>Cam kết SMART</h3>
      <p><strong>S</strong>pecific (cụ thể) – <strong>M</strong>easurable (đo được) – <strong>A</strong>chievable (khả thi) – <strong>R</strong>elevant (phù hợp) – <strong>T</strong>ime-bound (có hạn).</p>
      <p>Ví dụ: "Trong 3 tháng tới, tôi sẽ đi bộ 30 phút × 5 ngày/tuần và xét nghiệm lại lipid máu cuối tháng 3."</p>
      <div class="callout">
        <strong>📜 Bài tập hôm nay:</strong> <strong>Viết cam kết 3 tháng</strong> theo công thức SMART. Dán lên gương hoặc tủ lạnh để mỗi ngày đều thấy.
      </div>
    `
  },
  {
    day: 23,
    title: "Khi đi ăn ngoài",
    subtitle: "Giai đoạn 4 · Vẫn lành mạnh dù không nấu ở nhà",
    body: `
      <h3>5 nguyên tắc khi đi ăn ngoài</h3>
      <ol>
        <li><strong>Xem menu trước</strong>: tìm món luộc, hấp, áp chảo, salad</li>
        <li><strong>Ưu tiên cá, thịt nạc</strong>: tránh thịt đỏ chế biến, nội tạng</li>
        <li><strong>Yêu cầu giảm dầu, giảm muối, giảm đường</strong>: hầu hết quán đều đáp ứng</li>
        <li><strong>Ăn rau trước, đạm sau, tinh bột cuối</strong>: ổn định đường huyết</li>
        <li><strong>Uống nước lọc thay nước ngọt</strong></li>
      </ol>
      <h3>Mẹo thực tế</h3>
      <ul>
        <li>Quán phở: yêu cầu ít bánh, nhiều rau, không nước béo</li>
        <li>Buffet: lấy ½ đĩa rau trước, không quay lại lần 2 ở khu chiên</li>
        <li>Tiệc cưới: ăn nhẹ trước khi đi để không đói; chọn món thanh đạm</li>
        <li>Cà phê: gọi cà phê đen, latte không đường, hoặc trà</li>
      </ul>
      <h3>Khi không tránh được món xấu</h3>
      <p>Nếu phải ăn món chiên/ngọt, ăn ít, ăn chậm, kết hợp rau và đi bộ 15 phút sau đó. Đừng cảm thấy có lỗi.</p>
      <div class="callout">
        <strong>🍜 Bài tập hôm nay:</strong> Lần ăn ngoài kế tiếp (hoặc hôm nay nếu có), <strong>chọn món lành mạnh</strong> theo 5 nguyên tắc trên. Chụp lại để khẳng định lựa chọn.
      </div>
    `
  },
  {
    day: 24,
    title: "Khi bận rộn",
    subtitle: "Giai đoạn 4 · Bận đến mấy cũng phải khỏe mạnh",
    body: `
      <h3>Meal prep – chuẩn bị bữa ăn trước</h3>
      <p>Dành <strong>1–2 giờ cuối tuần</strong> để chuẩn bị nguyên liệu cho cả tuần — tiết kiệm thời gian và đảm bảo lựa chọn lành mạnh.</p>
      <h3>4 việc cần làm</h3>
      <ol>
        <li><strong>Mua sẵn</strong>: rau lá xanh, trái cây, đậu hũ, cá, trứng, yến mạch</li>
        <li><strong>Sơ chế và chia hộp</strong>: rửa rau, chia thịt thành phần ăn 1 bữa</li>
        <li><strong>Nấu sẵn</strong>: gạo lứt, đậu, ức gà luộc → ngăn mát 4–5 ngày</li>
        <li><strong>Đóng gói snack lành mạnh</strong>: hạt mix, trái cây, sữa chua không đường</li>
      </ol>
      <h3>Bữa nhanh trong 5–10 phút</h3>
      <ul>
        <li>Yến mạch + sữa + chuối + hạt → 3 phút</li>
        <li>Salad gà + bơ + dầu ô liu → 5 phút</li>
        <li>Trứng ốp + rau xào + cơm gạo lứt → 10 phút</li>
      </ul>
      <h3>Khi không có thời gian nấu</h3>
      <p>Đặt món lành mạnh: cơm gạo lứt + ức gà luộc + rau xào, salad cá hồi, bún cá thanh đạm.</p>
      <div class="callout">
        <strong>🍱 Bài tập hôm nay:</strong> <strong>Chuẩn bị bữa ăn trước</strong> cho ít nhất 2 ngày tới. Có thể là sơ chế rau, luộc gạo lứt, hoặc nấu 1 nồi soup rau củ.
      </div>
    `
  },
  {
    day: 25,
    title: "Khi thèm ăn",
    subtitle: "Giai đoạn 4 · Đối phó cơn thèm thông minh",
    body: `
      <h3>Vì sao bạn thèm ngọt/chiên?</h3>
      <ul>
        <li>Đường huyết hạ đột ngột (do bữa trước nhiều tinh bột)</li>
        <li>Stress làm tăng cortisol → cơ thể đòi đường</li>
        <li>Thiếu ngủ → tăng hormone đói (ghrelin)</li>
        <li>Nhìn quảng cáo, thấy người khác ăn → cám dỗ tâm lý</li>
      </ul>
      <h3>Quy tắc 10 phút</h3>
      <p>Khi thèm, hãy <strong>chờ 10 phút</strong> và làm việc khác (uống nước, đi bộ, đánh răng). 70% trường hợp cơn thèm tự biến mất.</p>
      <h3>Thay thế thông minh</h3>
      <ul>
        <li>Thèm kẹo → 1 quả táo, vài quả nho, vài múi cam</li>
        <li>Thèm bánh ngọt → sữa chua không đường + việt quất + 1 muỗng mật ong</li>
        <li>Thèm khoai chiên → ngô luộc, đậu rang, hạt mix</li>
        <li>Thèm trà sữa → trà xanh + 1 lát chanh + 1 muỗng nhỏ mật ong</li>
        <li>Thèm gà rán → ức gà nướng tẩm gia vị</li>
      </ul>
      <h3>Khi đã "lỡ" ăn</h3>
      <p>Không tự trách. Quay lại đúng lộ trình ngay bữa kế tiếp — không "ăn bù" cả ngày.</p>
      <div class="callout">
        <strong>🍎 Bài tập hôm nay:</strong> Khi cơn thèm xuất hiện, <strong>thay bằng 1 thực phẩm tốt</strong> trong danh sách trên. Ghi lại đã thay món gì bằng món gì.
      </div>
    `
  },
  {
    day: 26,
    title: "Duy trì vận động",
    subtitle: "Giai đoạn 4 · Chọn môn yêu thích để gắn bó lâu dài",
    body: `
      <h3>Bài tập tốt nhất là bài bạn duy trì được</h3>
      <p>Không cần chạy marathon hay vào gym hàng ngày. Bí quyết là chọn môn <strong>phù hợp lối sống và sở thích</strong>.</p>
      <h3>Gợi ý theo tính cách</h3>
      <ul>
        <li><strong>Thích yên tĩnh</strong>: đi bộ, yoga, bơi, đạp xe</li>
        <li><strong>Thích cộng đồng</strong>: lớp aerobic, dance fitness, đi bộ nhóm</li>
        <li><strong>Thích thử thách</strong>: chạy bộ, leo núi, gym</li>
        <li><strong>Bận rộn</strong>: HIIT 15 phút tại nhà, đi bộ giờ nghỉ trưa</li>
      </ul>
      <h3>Công thức "3-2-1"</h3>
      <ul>
        <li><strong>3 buổi cardio/tuần</strong>: đi bộ, đạp xe, bơi (30–45 phút)</li>
        <li><strong>2 buổi tập sức mạnh/tuần</strong>: squat, plank, push-up</li>
        <li><strong>1 buổi vận động vui vẻ/tuần</strong>: đá bóng, cầu lông, dance...</li>
      </ul>
      <h3>Mẹo duy trì</h3>
      <ul>
        <li>Ghép cùng bạn tập – có người chờ là khó bỏ</li>
        <li>Đặt lịch như cuộc họp quan trọng</li>
        <li>Chuẩn bị giày/quần áo từ tối hôm trước</li>
        <li>Đa dạng để không nhàm chán</li>
      </ul>
      <div class="callout">
        <strong>🏃 Bài tập hôm nay:</strong> <strong>Chọn 1 môn vận động phù hợp</strong> để gắn bó lâu dài sau chương trình. Ghi ra: tên môn, tần suất/tuần, địa điểm, thời gian cụ thể.
      </div>
    `
  },
  {
    day: 27,
    title: "Theo dõi sức khỏe",
    subtitle: "Giai đoạn 4 · Số liệu giúp duy trì động lực",
    body: `
      <h3>Vì sao cần theo dõi?</h3>
      <ul>
        <li>Phát hiện sớm khi mỡ máu tăng trở lại</li>
        <li>Biết phương pháp nào hiệu quả với mình</li>
        <li>Có động lực khi thấy số liệu cải thiện</li>
        <li>Là cơ sở để bác sĩ điều chỉnh thuốc (nếu có)</li>
      </ul>
      <h3>Số liệu nên đo</h3>
      <table style="width:100%; border-collapse: collapse; margin: 10px 0;">
        <tr style="background: var(--green-50);"><th style="text-align:left; padding: 8px; border: 1px solid var(--green-200);">Chỉ số</th><th style="text-align:left; padding: 8px; border: 1px solid var(--green-200);">Tần suất</th></tr>
        <tr><td style="padding: 8px; border: 1px solid var(--green-200);">Cân nặng</td><td style="padding: 8px; border: 1px solid var(--green-200);">1 lần/tuần, sáng đói</td></tr>
        <tr><td style="padding: 8px; border: 1px solid var(--green-200);">Vòng bụng</td><td style="padding: 8px; border: 1px solid var(--green-200);">2 tuần/lần</td></tr>
        <tr><td style="padding: 8px; border: 1px solid var(--green-200);">Huyết áp</td><td style="padding: 8px; border: 1px solid var(--green-200);">2 lần/tuần (nếu có máy)</td></tr>
        <tr><td style="padding: 8px; border: 1px solid var(--green-200);">Lipid máu</td><td style="padding: 8px; border: 1px solid var(--green-200);">3–6 tháng/lần</td></tr>
      </table>
      <h3>Vòng bụng – chỉ số quan trọng</h3>
      <p>Đo ngang rốn khi thở ra:</p>
      <ul>
        <li>Nam: &lt; 90 cm là an toàn</li>
        <li>Nữ: &lt; 80 cm là an toàn</li>
      </ul>
      <p>Vòng bụng giảm = mỡ nội tạng giảm = nguy cơ tim mạch giảm.</p>
      <div class="callout">
        <strong>📏 Bài tập hôm nay:</strong> <strong>Đo lại cân nặng và vòng bụng</strong>. So sánh với số liệu ngày 1 (nếu có). Ghi vào sổ tay hoặc ứng dụng để theo dõi tiếp.
      </div>
    `
  },
  {
    day: 28,
    title: "Tổng kết & tái cam kết",
    subtitle: "Giai đoạn 4 · Chúc mừng bạn hoàn thành 28 ngày!",
    body: `
      <h3>🎉 Bạn đã đi qua 28 ngày!</h3>
      <p>Hãy nhìn lại những gì mình đã làm được:</p>
      <h3>Giai đoạn 1 – Nhận thức</h3>
      <ul>
        <li>Hiểu rõ mỡ máu, các chỉ số, thủ phạm</li>
        <li>Bắt đầu uống đủ nước và đi bộ</li>
      </ul>
      <h3>Giai đoạn 2 – Nền tảng ăn uống</h3>
      <ul>
        <li>Đĩa ăn chuẩn, chất béo tốt, chất xơ</li>
        <li>Cắt đường, bổ sung omega-3</li>
      </ul>
      <h3>Giai đoạn 3 – Tăng chuyển hóa</h3>
      <ul>
        <li>Đi bộ và vận động nhẹ đều đặn</li>
        <li>Ngủ trước 23h, quản lý stress</li>
        <li>Thói quen sáng và tối lành mạnh</li>
      </ul>
      <h3>Giai đoạn 4 – Ổn định</h3>
      <ul>
        <li>Tư duy dài hạn 80/20</li>
        <li>Đối phó với ăn ngoài, bận rộn, cơn thèm</li>
        <li>Chọn môn vận động lâu dài, theo dõi số liệu</li>
      </ul>
      <h3>Sau 28 ngày bạn đã đạt được:</h3>
      <ul>
        <li>✓ Giảm thói quen xấu</li>
        <li>✓ Ăn uống có ý thức hơn</li>
        <li>✓ Bắt đầu giảm cân, giảm mỡ</li>
        <li>✓ Quan trọng nhất: <strong>không quay lại lối sống cũ</strong></li>
      </ul>
      <div class="callout">
        <strong>🏆 Bài tập hôm nay:</strong> <strong>Viết kết quả đạt được sau 28 ngày</strong>. Bao gồm: cân nặng giảm, vòng bụng giảm, năng lượng cải thiện, thói quen mới đã xây dựng. Đồng thời, viết <strong>tái cam kết 3 tháng tiếp theo</strong> để duy trì.
        <br><br>
        <strong>Dược sĩ Đạt:</strong> Bạn đã đi được chặng đường dài. Sức khỏe không phải đích đến mà là cách bạn sống mỗi ngày. Hãy tiếp tục nhé!
      </div>
    `
  }
];
