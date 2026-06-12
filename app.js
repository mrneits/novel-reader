let chapters = [];
let current = 0;

fetch("chapters.json")
.then(res => res.json())
.then(data => {
    chapters = data;

    const list = document.getElementById("list");

    chapters.forEach((chapter,index)=>{
        const li = document.createElement("li");
        li.innerText = chapter.title;
        li.onclick = ()=>openChapter(index);
        list.appendChild(li);
    });
});

function openChapter(index){
    current = index;

    document.getElementById("chapterList").style.display="none";
    document.getElementById("reader").style.display="block";

    document.getElementById("title").innerText =
        chapters[index].title;

    document.getElementById("content").innerText =
        chapters[index].content;
}

function showList(){
    document.getElementById("reader").style.display="none";
    document.getElementById("chapterList").style.display="block";
}

function nextChapter(){
    if(current < chapters.length-1){
        openChapter(current+1);
    }
}

function prevChapter(){
    if(current > 0){
        openChapter(current-1);
    }
}