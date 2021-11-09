var index = 0;
var li = $(".banner ul li");
var img = $(".music .m_img img");
var text = $(".music .m_text");
var prev = $(".music .m_btn .m_prev");
var play = $(".music .m_btn .m_play");
var noplay = $(".music .m_btn .m_pause");
var next = $(".music .m_btn .m_next");

var mp3 = $(".music .m_mp3");
var flag = false;
var close = true;

li.click(function () {
    // console.log($(this).index());
    if (flag) {
        showon();
        mp3.get(0).pause();
        li.eq(index).children().removeClass("img_rotate");
        flag = false;
    }
    else {
        index = $(this).index();
        show();
    }
});

function show() {
    // change_bg(index + 1);
    chang_img_text(index + 1);
    showon();
    play_mp3();
    img_rotate();

}

function img_rotate() {
    li.children().removeClass("img_rotate");
    li.eq(index).children().addClass("img_rotate");
}



// function change_bg(idx) {
//     $("body").css({
//         "background": "url(img/" + idx + "img.jpg) no-repeat",
//         "background-size": "cover"

//     });
// }


function chang_img_text(idx) {

    img.attr("src", "/static/img/" + idx + "img.jpg");
    text.html(li.eq(index).attr("title"));
}


function showon() {

    var dakai = document.getElementById("m_play");
    var guangbi = document.getElementById("m_pause");
    if (flag) {
        dakai.style.display = "block";
        guangbi.style.display = "none";

    } else {


        guangbi.style.display = "block";
        dakai.style.display = "none";
    }
}


function play_mp3() {
    mp3.attr("src", li.eq(index).attr("datasrc"));
    mp3.get(0).play();
    flag = true;

}


noplay.click(function () {
    if (flag) {
        mp3.get(0).pause();
        li.eq(index).children().removeClass("img_rotate");
        // play.removeClass("m_pause").addClass("m_play").attr("title", "播放");
        showon();
        flag = false;

    } else {

        mp3.get(0).play();
        li.eq(index).children().addClass("img_rotate");
        showon();
        flag = true;

    }


});
play.click(function () {
    if (flag) {
        mp3.get(0).pause();
        li.eq(index).children().removeClass("img_rotate");
        // play.removeClass("m_pause").addClass("m_play").attr("title", "播放");
        flag = false;
        showon();
    } else {

        mp3.get(0).play();
        li.eq(index).children().addClass("img_rotate");
        showon();
        flag = true;
        change_bg(index + 1);
    }
});

prev.click(function () {
    index--;
    if (index < 0) {
        index = li.length - 1;
    }

    show();
    flag = false;
    showon();
});

next.click(function () {
    index++;
    if (index > li.length - 1) {
        index = 0;
    }

    show();
    flag = false;
    showon();
});


$(".m_close").click(function () {
    if (close) {
        $(this).addClass("m_open");
        $(".music").animate({ "left": "-500px" }, 1000);
        close = false;
    } else {
        $(this).removeClass("m_open");
        $(".music").animate({ "left": "0px" }, 1000);
        close = true;
    }
});















