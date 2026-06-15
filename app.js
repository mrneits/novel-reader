let chapters = [];
let current = 0;

const PAGE_SIZE = 20;
let currentPage = 1;
let currentData = [];

// ⚙========= VARIABLES FOR POSITION MANAGEMENT =========
let isRestoringScroll = false; // Cờ chặn việc ghi đè vị trí cũ trong lúc trình duyệt đang khôi phục màn hình


// =====================
// 🌓 INITIALIZE GIAO DIỆN (Kích hoạt sớm để tránh hiện tượng nháy trắng màn hình)
// =====================
initTheme();

function initTheme() {
    const savedTheme = localStorage.getItem("reader_theme");
    
    // Nếu người dùng đã cài đặt trước đó, áp dụng ngay lập tức
    if (savedTheme === "dark") {
        document.body.classList.add("dark-mode");
    } else if (savedTheme === "light") {
        document.body.classList.remove("dark-mode");
    } else {
        // Trường hợp truy cập lần đầu: Tự động tối ưu theo cấu hình hệ điều hành của thiết bị
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        if (prefersDark) {
            document.body.classList.add("dark-mode");
        }
    }
    
    // Chờ cấu trúc DOM sẵn sàng để cập nhật đúng Icon hiển thị
    window.addEventListener("DOMContentLoaded", updateThemeButtonIcon);
}

function toggleTheme() {
    const isDark = document.body.classList.toggle("dark-mode");
    
    // Lưu cấu hình lựa chọn dài hạn vào bộ nhớ trình duyệt
    localStorage.setItem("reader_theme", isDark ? "dark" : "light");
    
    updateThemeButtonIcon();
}

function updateThemeButtonIcon() {
    const btn = document.getElementById("themeToggle");
    if (!btn) return;
    
    if (document.body.classList.contains("dark-mode")) {
        btn.textContent = "☀️"; // Đang ở nền tối -> Hiển thị mặt trời để đổi sang sáng
        btn.title = "Chuyển sang giao diện sáng";
    } else {
        btn.textContent = "🌙"; // Đang ở nền sáng -> Hiển thị mặt trăng để đổi sang tối
        btn.title = "Chuyển sang giao diện tối";
    }
}


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

    // 📌 KHÔI PHỤC VỊ TRÍ ĐỌC DỞ CHÍNH XÁC
    const savedChapterId = localStorage.getItem("bookmark_chapter_id");
    const savedPosition = localStorage.getItem("bookmark_scroll_pos");
    
    if (savedChapterId && savedPosition && savedChapterId === chapter.id.toString()) {
        isRestoringScroll = true;
        
        // Đặt timeout 100ms chờ trình duyệt render HTML xong để cuộn nhảy đến đúng vị trí cũ
        setTimeout(() => {
            window.scrollTo(0, parseInt(savedPosition));
            isRestoringScroll = false;
        }, 100);
    } else {
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
// 📌 LẮNG NGHE & CẬP NHẬT VỊ TRÍ KHI NGƯỜI DÙNG CUỘN TRANG
// =====================
window.addEventListener("scroll", () => {
    if (document.getElementById("reader").style.display === "block" && !isRestoringScroll && chapters[current]) {
        const chapterId = chapters[current].id;
        
        // Chỉ lưu duy nhất 1 thông tin vị trí của chương mới nhất đang đọc dở
        localStorage.setItem("bookmark_chapter_id", chapterId);
        localStorage.setItem("bookmark_scroll_pos", window.scrollY);
    }
});


// =====================
// NAVIGATION
// =====================
function nextChapter(){
    if(current < chapters.length - 1){
        openChapter(current + 1);
    }
}

function prevChapter(){
    if(current > 0){
        openChapter(current - 1);
    }
}


// =====================
// BACK TO LIST
// =====================
function showList(){
    document.getElementById("reader").style.display = "none";
    document.getElementById("chapterList").style.display = "block";
}
