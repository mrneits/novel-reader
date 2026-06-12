let chapters = [];
let current = 0;

fetch("chapters/index.json")
.then(res => res.json())
.then(data => {

    chapters = data;

    const list = document.getElementById("list");

    chapters.forEach((chapter,index)=>{

        const li = document.createElement("li");

        li.textContent = chapter.title;

        li.onclick = () => openChapter(index);

        list.appendChild(li);
    });
});

async function openChapter(index){

    current = index;

    const chapter = chapters[index];

    const response =
        await fetch(`chapters/${chapter.file}`);

    const markdown =
        await response.text();

    document.getElementById("title").textContent =
        chapter.title;

    document.getElementById("content").innerHTML =
        marked.parse(markdown);

    document.getElementById("chapterList").style.display =
        "none";

    document.getElementById("reader").style.display =
        "block";
}

function showList(){

    document.getElementById("reader").style.display =
        "none";

    document.getElementById("chapterList").style.display =
        "block";
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