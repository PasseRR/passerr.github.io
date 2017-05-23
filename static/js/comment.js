// fork from https://github.com/YangHanqing/yanghanqing.github.io
$(document).ready(function () {
    var user = getUser();
    var issuesHTML = 'https://github.com/' + user + '/' + user + '.github.io/issues'

    $("#commentsList").removeAttr('data_comments_url');
    $("#tips").html("我们不会获取您的用户名和密码,评论直接通过 HTTPS 与 Github API交互,<br>如果您开启了两步验证,请在博客的<a  target=\"_blank\" href=\"" + issuesHTML + "\">Github issues</a>下添加 Comment");
    setCommentURL(getIssuesUrl(), getTitle());
});

function getUser() {
    return $('meta[name="author"]').attr("content");
}

function getIssuesUrl() {
    var user = getUser();
    return 'https://api.github.com/repos/' + user + '/' + user + '.github.io/issues';
}

function getTitle() {
    var publishTime = $("meta[property='article:published_time']").attr("content");
    var title = $("meta[property='og:title']").attr("content");
    return publishTime.substring(0, 10) + " " + title;
}


function setCommentURL(issuesList, blogName) {
    $("#comments").show();
    $.ajax({
        type: "GET",
        url: issuesList,
        dataType: 'json',
        async: false,
        success: function (json) {
            for (var i = 0; i < json.length; i++) {
                var title = json[i].title; // Blog title
                var comments_url = json[i].comments_url;
                if (title == blogName) {
                    // console.log("该文章存在评论")
                    $('#commentsList').attr("data_comments_url", comments_url);
                    setComment(comments_url);
                    break;
                }
                $("#commentsList").children().remove();
                $("#commentsList").removeAttr('data_comments_url');
            }
        }
    });
}


function setComment(commentURL) {
    $('#commentsList').children().remove();

    $.getJSON(commentURL, function (json) {
        for (var i = 0; i < json.length; i++) {
            var avatar_url = json[i].user.avatar_url; // avatar_url
            var user = json[i].user.login;
            //var updated_at = json[i].updated_at;
            var updated_at = new Date(json[i].updated_at).toLocaleString();
            var body = json[i].body;

            // add blog list elements
            var commentHtml =
                "<li class=\"comment\">" +
                "<a class=\"pull-left\" href=\"#\"><img class=\"avatar\" src=\"" + avatar_url +
                "\" alt=\"avatar\"></a><div class=\"comment-body\"><div class=\"comment-heading\"><h4 class=\"user\">" + user +
                "</h4><h5 class=\"time\">" + updated_at +
                "</h5></div><p>" + body +
                "</p></div></li>";

            var new_obj = $(commentHtml);
            // 评论倒叙
            $('#commentsList').prepend(new_obj);
        }
    });

}

function login() {
    $('#myModal').modal();
}

function subComment() {
    var title = getTitle();
    var USERNAME = $("#txt_username").val();
    var PASSWORD = document.getElementById("txt_password").value; //
    // 未开启评论
    if (typeof($("#commentsList").attr("data_comments_url")) == "undefined") {
        if (title == undefined || title == null || title == "") {
            return;
        }
        var createIssueJson = "{\"title\": \"" + title + "\"}";
        $.ajax({
            type: "POST",
            url: getIssuesUrl(),
            dataType: 'json',
            async: false,
            headers: {
                "Authorization": "Basic " + btoa(USERNAME + ":" + PASSWORD)
            },
            data: createIssueJson,
            success: function () {
                // console.log('开启评论成功:' + title);
                //重新遍历issue list
                setCommentURL(getIssuesUrl(), title);
            }
        });
    }
    // console.log("准备提交评论");
    // 已开启评论
    if (typeof($("#commentsList").attr("data_comments_url")) != "undefined") {
        var issueURL = $("#commentsList").attr("data_comments_url");
        var comment = $("#comment_txt").val();
        var commentJson = "{\"body\": \"" + comment + "\"}";
        // console.log(comment);
        if (comment == "") {
            alert("评论不能为空");
            return;
        }

        $.ajax({
            type: "POST",
            url: issueURL,
            dataType: 'json',
            async: false,
            headers: {
                "Authorization": "Basic " + btoa(USERNAME + ":" + PASSWORD)
            },
            data: commentJson,
            success: function () {
                // 更新评论区
                if (title != null) {
                    setCommentURL(getIssuesUrl(), title);
                }

                $("#comment_txt").val('');
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                alert("账号密码错误,或者开启了两步验证");
            }
        });
    } else {
        console.log("未开启评论")
    }
}