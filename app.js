let chapters = [];
let current = 0;

const PAGE_SIZE = 20;
let currentPage = 1;
let currentData = [];

// ⚙️ VARIABLES FOR POSITION MANAGEMENT
let isRestoringScroll = false; // Cờ chặn việc ghi đè vị trí cũ trong lúc trình duyệt đang khôi phục màn hình


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
    
    // Nếu ID chương đang mở trùng khớp với ID chương lưu trong máy
    if (savedChapterId && savedPosition && savedChapterId === chapter.id.toString()) {
        isRestoringScroll = true;
        
        // Đặt timeout ngắn (100ms) chờ trình duyệt render HTML xong để cuộn nhảy đến đúng vị trí cũ
        setTimeout(() => {
            window.scrollTo(0, parseInt(savedPosition));
            isRestoringScroll = false;
        }, 100);
    } else {
        // Nếu mở một chương khác hoặc chưa từng đọc chương này, đưa thẳng lên đầu trang
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
    // Chỉ lưu vị trí nếu đang ở màn hình đọc và không nằm trong tiến trình khôi phục cuộn trang cũ
    if (document.getElementById("reader").style.display === "block" && !isRestoringScroll && chapters[current]) {
        const chapterId = chapters[current].id;
        
        // Chỉ lưu duy nhất 1 thông tin vị trí của chương mới nhất đang đọc
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
