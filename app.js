let chapters = [];
let current = 0;

const PAGE_SIZE = 20;
let currentPage = 1;
let currentData = [];

// ⚙️ VARIABLES FOR AUTO SCROLL & POSITION
let autoScrollActive = false;
let scrollSpeed = 2; // Pixel cuộn mỗi khung hình
let scrollAnimationId = null;
let isRestoringScroll = false; // Cờ chặn việc ghi đè vị trí khi đang khôi phục cuộn cũ


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

    // 1. Dừng cuộn tự động và XÓA vị trí cuộn của chương cũ trước khi chuyển
    stopAutoScroll();
    clearScrollPosition();

    current = index;

    const chapter = chapters[index];

    const res = await fetch(`chapters/${chapter.file}`);
    const md = await res.text();

    document.getElementById("title").textContent = chapter.title;
    document.getElementById("content").innerHTML = marked.parse(md);

    document.getElementById("chapterList").style.display = "none";
    document.getElementById("reader").style.display = "block";

    // 📌 SAVE LAST READ (Lưu chương đọc gần nhất)
    saveLastRead(index);
    renderLastRead();

    // 📌 RESTORE SCROLL POSITION
    // Kiểm tra xem chương chuẩn bị mở này có trùng với chương đã lưu vị trí trước đó không
    const savedChapterId = localStorage.getItem("scroll_chapter_id");
    const savedPosition = localStorage.getItem("current_scroll_pos");
    
    if (savedChapterId && savedPosition && savedChapterId === chapter.id.toString()) {
        isRestoringScroll = true;
        // Đợi DOM render xong hoàn toàn để tính toán đúng chiều cao trang
        setTimeout(() => {
            window.scrollTo(0, parseInt(savedPosition));
            isRestoringScroll = false;
        }, 80);
    } else {
        // Nếu là chương hoàn toàn mới hoặc chưa có dữ liệu vị trí, đưa lên đầu trang
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
// 📌 LOGIC GIỮ & XÓA VỊ TRÍ CUỘN (TỐI ƯU HÓA)
// =====================

// Hàm xóa vị trí cuộn cũ
function clearScrollPosition() {
    localStorage.removeItem("scroll_chapter_id");
    localStorage.removeItem("current_scroll_pos");
}

// Lắng nghe hành vi cuộn trang của người dùng để lưu vị trí (Chỉ lưu duy nhất chương đang đọc)
window.addEventListener("scroll", () => {
    if (document.getElementById("reader").style.display === "block" && !isRestoringScroll && chapters[current]) {
        const chapterId = chapters[current].id;
        localStorage.setItem("scroll_chapter_id", chapterId);
        localStorage.setItem("current_scroll_pos", window.scrollY);
    }
});


// =====================
// ⚙️ AUTO SCROLL LOGIC
// =
