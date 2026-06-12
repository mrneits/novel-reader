let chapters = [];
let current = 0;

const PAGE_SIZE = 20;
let currentPage = 1;
let currentData = [];

// ⚙️ VARIABLES FOR AUTO SCROLL & POSITION
let autoScrollActive = false;
let scrollSpeed = 2; // Pixel cuộn mỗi khung hình
let scrollAnimationId = null;
let isRestoringScroll = false; // Cờ chặn việc ghi đè vị trí cũ khi đang tự động cuộn đến vị trí cũ


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

    // Dừng cuộn tự động khi chuyển chương mới
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

    // 📌 RESTORE SCROLL POSITION (Khôi phục vị trí đọc cũ)
    isRestoringScroll = true;
    const savedPosition = localStorage.getItem(`scrollPos_chapter_${chapter.id}`);
    
    if (savedPosition) {
        // Đặt một khoảng timeout ngắn để đảm bảo nội dung HTML đã render hoàn tất và trình duyệt tính toán đúng chiều cao trang
        setTimeout(() => {
            window.scrollTo(0, parseInt(savedPosition));
            isRestoringScroll = false;
        }, 80);
    } else {
        window.scrollTo(0, 0);
        isRestoringScroll = false;
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
// 📌 MONITOR & SAVE SCROLL POSITION
// =====================
// Lắng nghe hành vi cuộn trang của người dùng để lưu vị trí
window.addEventListener("scroll", () => {
    // Chỉ lưu nếu đang ở màn hình đọc truyện, không ở trong quá trình khôi phục cuộn cũ, và danh sách chương đã tải xong
    if (document.getElementById("reader").style.display === "block" && !isRestoringScroll && chapters[current]) {
        const chapterId = chapters[current].id;
        localStorage.setItem(`scrollPos_chapter_${chapterId}`, window.scrollY);
    }
});


// =====================
// ⚙️ AUTO SCROLL LOGIC
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

    // Hàm thực hiện cuộn lặp lại mượt mà qua từng khung hình (AnimationFrame)
    function scrollStep() {
        if (!autoScrollActive) return;
        
        window.scrollBy(0, scrollSpeed);

        // Kiểm tra nếu trang đã cuộn tới đáy thì tự động dừng lại
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
    // Ép kiểu giá trị thanh trượt về dạng số thực (Float) để tốc độ tăng giảm mượt mà
    scrollSpeed = parseFloat(val);
}

// 📌 TIỆN ÍCH UX: Người dùng dùng chuột cuộn ngược lên (Scroll Up) sẽ tự động dừng Auto Scroll tránh xung đột trải nghiệm
window.addEventListener("wheel", (e) => {
    if (autoScrollActive && e.deltaY < 0) { 
        stopAutoScroll();
    }
});

// Hỗ trợ sự kiện vuốt ngược lên trên thiết bị màn hình cảm ứng (Mobile)
let touchStartY = 0;
window.addEventListener("touchstart", (e) => {
    touchStartY = e.touches[0].clientY;
}, { passive: true });

window.addEventListener("touchmove", (e) => {
    if (autoScrollActive) {
        let touchMoveY = e.touches[0].clientY;
        if (touchMoveY > touchStartY + 10) { // Người dùng đang vuốt màn hình xuống để kéo nội dung lên trên
            stopAutoScroll();
        }
    }
}, { passive: true });


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
    stopAutoScroll(); // Dừng cuộn khi thoát ra mục lục
    document.getElementById("reader").style.display = "none";
    document.getElementById("chapterList").style.display = "block";
}
