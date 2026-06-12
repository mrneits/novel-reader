let chapters = [];
let current = 0;

const PAGE_SIZE = 20;
let currentPage = 1;
let currentData = [];

// ⚙️ VARIABLES FOR AUTO SCROLL & POSITION
let autoScrollActive = false;
let scrollSpeed = 2; // Pixel cuộn mỗi khung hình (Dành cho nút Auto Scroll nếu dùng)
let scrollAnimationId = null;
let isRestoringScroll = false; // Cờ chặn việc ghi đè vị trí cũ trong lúc đang khôi phục màn hình


// =====================
// LOAD DATA
// =====================
fetch("chapters/index.json")
.then(res => res.json())
.then(data => {

    chapters = data;
    currentData = chapters;

    renderPage(currentPage);
    renderLastRead();
});


// =====================
// RENDER PAGE (PAGINATION)
// =====================
function renderPage(page){

    const list = document.getElementById("list");
    list.innerHTML = "";

    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;

    const pageItems = currentData.slice(start, end);

    pageItems.forEach(chapter => {

        const realIndex = chapters.findIndex(c => c.id === chapter.id);

        const li = document.createElement("li");
        li.textContent = chapter.title;

        li.onclick = () => openChapter(realIndex);

        list.appendChild(li);
    });

    renderPagination();
}


// =====================
// PAGINATION UI
// =====================
function renderPagination(){

    const box = document.getElementById("pagination");
    box.innerHTML = "";

    const totalPages = Math.ceil(currentData.length / PAGE_SIZE);

    const prev = document.createElement("button");
    prev.textContent = "⬅";
    prev.onclick = () => changePage(-1);

    const next = document.createElement("button");
    next.textContent = "➡";
    next.onclick = () => changePage(1);

    const info = document.createElement("span");
    info.textContent = `Trang ${currentPage} / ${totalPages}`;

    box.appendChild(prev);
    box.appendChild(info);
    box.appendChild(next);
}


// =====================
// CHANGE PAGE
// =====================
function changePage(step){

    const totalPages = Math.ceil(currentData.length / PAGE_SIZE);

    currentPage += step;

    if(currentPage < 1) currentPage = 1;
    if(currentPage > totalPages) currentPage = totalPages;

    renderPage(currentPage);
}


// =====================
// SEARCH
// =====================
function searchChapter(){

    const keyword = document.getElementById("searchInput")
        .value.toLowerCase();

    if(keyword === ""){
        currentData = chapters;
    }else{
        currentData = chapters.filter(c =>
            c.title.toLowerCase().includes(keyword) ||
            c.id.toString().includes(keyword)
        );
    }

    currentPage = 1;
    renderPage(currentPage);
}


// =====================
// OPEN CHAPTER
// =====================
async function openChapter(index){

    // Dừng cuộn tự động nếu đang chạy trước khi chuyển chương
    stopAutoScroll();

    current = index;
    const chapter = chapters[index];

    const res = await fetch(`chapters/${chapter.file}`);
    const md = await res.text();

    document.getElementById("title").textContent = chapter.title;
    document.getElementById("content").innerHTML = marked.parse(md);

    document.getElementById("chapterList").style.display = "none";
    document.getElementById("reader").style.display = "block";

    // 📌 SAVE LAST READ
    saveLastRead(index);
    renderLastRead();

    // 📌 🔴 KHÔI PHỤC VỊ TRÍ ĐỌC DỞ CHÍNH XÁC
    // Đọc thông tin chương đọc dở cuối cùng được lưu trong LocalStorage
    const savedChapterId = localStorage.getItem("bookmark_chapter_id");
    const savedPosition = localStorage.getItem("bookmark_scroll_pos");
    
    // Nếu ID chương đang mở trùng khớp với ID chương lưu trong máy
    if (savedChapterId && savedPosition && savedChapterId === chapter.id.toString()) {
        isRestoringScroll = true;
        
        // Đặt timeout 100ms để đảm bảo trình duyệt hoàn tất việc dựng layout và tính đúng độ dài trang web
        setTimeout(() => {
            window.scrollTo(0, parseInt(savedPosition));
            isRestoringScroll = false;
        }, 100);
    } else {
        // Nếu mở một chương hoàn toàn khác hoặc chưa từng đọc chương này, đưa thẳng lên đầu trang
        window.scrollTo(0, 0);
    }
}


// =====================
// LAST READ (LOCALSTORAGE)
// =====================
function saveLastRead(index){
    localStorage.setItem("lastReadChapter", index);
}

function renderLastRead(){

    const index = localStorage.getItem("lastReadChapter");
    const box = document.getElementById("lastRead");

    if(index === null){
        box.style.display = "none";
        return;
    }

    const chapter = chapters[index];

    box.style.display = "block";
    box.innerHTML = `📌 Đọc gần nhất: <b>${chapter.title}</b>`;

    box.onclick = () => openChapter(Number(index));
}


// =====================
// 📌 🔴 LẮNG NGHE & CẬP NHẬT VỊ TRÍ KHI NGƯỜI DÙNG CUỘN TRANG
// =====================
window.addEventListener("scroll", () => {
    // Chỉ thực hiện ghi nhận vị trí nếu:
    // 1. Đang ở màn hình đọc truyện (#reader đang hiển thị)
    // 2. Không ở trong tiến trình tự động phục hồi vị trí (tránh việc ghi đè số 0 khi trang chưa cuộn xong)
    // 3. Dữ liệu chương hiện tại đã được tải thành công
    if (document.getElementById("reader").style.display === "block" && !isRestoringScroll && chapters[current]) {
        const chapterId = chapters[current].id;
        
        // Luôn liên tục ghi đè vị trí mới nhất của chính chương này vào LocalStorage
        localStorage.setItem("bookmark_chapter_id", chapterId);
        localStorage.setItem("bookmark_scroll_pos", window.scrollY);
    }
});


// =====================
// ⚙️ AUTO SCROLL LOGIC (GIỮ NGUYÊN ĐỂ BẠN DÙNG NẾU MUỐN CUỘN TỰ ĐỘNG)
// =====================
function toggleAutoScroll() {
    if (autoScrollActive) {
        stopAutoScroll();
    } else {
        startAutoScroll();
    }
}

function startAutoScroll() {
    if (autoScrollActive) return;
    autoScrollActive = true;

    const btn = document.getElementById("autoScrollBtn");
    if (btn) {
        btn.textContent = "⏸ Dừng cuộn";
        btn.classList.add("active");
    }

    function scrollStep() {
        if (!autoScrollActive) return;
        
        window.scrollBy(0, scrollSpeed);

        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 2) {
            stopAutoScroll();
            return;
        }

        scrollAnimationId = requestAnimationFrame(scrollStep);
    }

    scrollAnimationId = requestAnimationFrame(scrollStep);
}

function stopAutoScroll() {
    autoScrollActive = false;
    if (scrollAnimationId) {
        cancelAnimationFrame(scrollAnimationId);
        scrollAnimationId = null;
    }

    const btn = document.getElementById("autoScrollBtn");
    if (btn) {
        btn.textContent = "▶ Tự động cuộn";
        btn.classList.remove("active");
    }
}

function updateScrollSpeed(val) {
    scrollSpeed = parseFloat(val);
}

// UX Tweak: Cuộn ngược lên để dừng auto scroll
window.addEventListener("wheel", (e) => {
    if (autoScrollActive && e.deltaY < 0) { 
        stopAutoScroll();
    }
});

// Hỗ trợ cảm ứng trên Mobile
let touchStartY = 0;
window.addEventListener("touchstart", (e) => {
    touchStartY = e.touches[0].clientY;
}, { passive: true });

window.addEventListener("touchmove", (e) => {
    if (autoScrollActive) {
        let touchMoveY = e.touches[0].clientY;
        if (touchMoveY > touchStartY + 10) {
            stop
