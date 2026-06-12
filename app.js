let chapters = [];
let current = 0;

const PAGE_SIZE = 20;
let currentPage = 1;
let currentData = [];

fetch("chapters/index.json")
.then(res => res.json())
.then(data => {
    chapters = data;
    currentData = chapters;
    renderPage(currentPage);
});


// =========================
// RENDER CHAPTER LIST
// =========================
function renderPage(page){

    const list = document.getElementById("list");
    list.innerHTML = "";

    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;

    const pageItems = currentData.slice(start, end);

    pageItems.forEach((chapter) => {

        const realIndex = chapters.findIndex(c => c.id === chapter.id);

        const li = document.createElement("li");
        li.textContent = chapter.title;

        li.onclick = () => openChapter(realIndex);

        list.appendChild(li);
    });

    renderPagination();
}


// =========================
// PAGINATION UI
// =========================
function renderPagination(){

    const container = document.getElementById("pagination");
    container.innerHTML = "";

    const totalPages = Math.ceil(currentData.length / PAGE_SIZE);

    const info = document.createElement("span");
    info.textContent = `Trang ${currentPage} / ${totalPages}`;

    const prev = document.createElement("button");
    prev.textContent = "⬅";
    prev.onclick = () => changePage(-1);

    const next = document.createElement("button");
    next.textContent = "➡";
    next.onclick = () => changePage(1);

    container.appendChild(prev);
    container.appendChild(info);
    container.appendChild(next);
}


// =========================
// CHANGE PAGE
// =========================
function changePage(step){

    const totalPages = Math.ceil(currentData.length / PAGE_SIZE);

    currentPage += step;

    if(currentPage < 1) currentPage = 1;
    if(currentPage > totalPages) currentPage = totalPages;

    renderPage(currentPage);
}


// =========================
// SEARCH CHAPTER
// =========================
function searchChapter(){

    const keyword = document.getElementById("searchInput")
        .value
        .toLowerCase();

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


// =========================
// OPEN CHAPTER
// =========================
async function openChapter(index){

    current = index;

    const chapter = chapters[index];

    const res = await fetch(`chapters/${chapter.file}`);
    const md = await res.text();

    document.getElementById("title").textContent = chapter.title;
    document.getElementById("content").innerHTML = marked.parse(md);

    document.getElementById("chapterList").style.display = "none";
    document.getElementById("reader").style.display = "block";

    window.scrollTo(0,0);
}


// =========================
// NAVIGATION
// =========================
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


// =========================
// BACK TO LIST
// =========================
function showList(){
    document.getElementById("reader").style.display = "none";
    document.getElementById("chapterList").style.display = "block";
}
