let chapters = [];
let current = 0;

fetch("chapters/index.json")
.then(response => response.json())
.then(data => {

    chapters = data;

    renderChapterList(chapters);

});

function renderChapterList(data){

    const list = document.getElementById("list");

    list.innerHTML = "";

    data.forEach(chapter => {

        const li = document.createElement("li");

        li.textContent = chapter.title;

        li.onclick = () => {

            const realIndex =
                chapters.findIndex(
                    c => c.id === chapter.id
                );

            openChapter(realIndex);
        };

        list.appendChild(li);
    });
}

function searchChapter(){

    const keyword =
        document
        .getElementById("searchInput")
        .value
        .toLowerCase();

    const filtered =
        chapters.filter(chapter =>

            chapter.title
                .toLowerCase()
                .includes(keyword)

            ||

            chapter.id
                .toString()
                .includes(keyword)
        );

    renderChapterList(filtered);
}

async function openChapter(index){

    current = index;

    const chapter = chapters[index];

    const response =
        await fetch(
            `chapters/${chapter.file}`
        );

    const markdown =
        await response.text();

    document.getElementById("title")
        .textContent =
        chapter.title;

    document.getElementById("content")
        .innerHTML =
        marked.parse(markdown);

    document.getElementById("chapterList")
        .style.display = "none";

    document.getElementById("reader")
        .style.display = "block";

    window.scrollTo(0,0);
}

function showList(){

    document.getElementById("reader")
        .style.display = "none";

    document.getElementById("chapterList")
        .style.display = "block";
}

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
