var BigBrother, FilterViewModel, Inbox, Ticket, User, login;

window.APIKey = "";

window.siteHref = "";

Inbox = function(name, id) {
  var self;
  self = this;
  self.name = name;
  self.id = id;
};

User = function(name, id, avatar) {
  var self;
  self = this;
  self.name = name;
  self.id = id;
  self.avatar = avatar;
};

Ticket = function(id, agent, preview, subject, status, date, avatar) {
  var self;
  self = this;
  self.id = id;
  self.agent = agent;
  self.preview = preview;
  self.subject = subject;
  self.status = status;
  self.date = date;
  self.avatar = avatar;
};

FilterViewModel = function() {
  var self;
  self = this;
  self.inboxes = ko.observableArray();
  self.users = ko.observableArray();
  self.selectedInboxes = ko.observableArray();
  self.selectedUsers = ko.observableArray();
  self.selectedUserIds = ko.observableArray();
  self.allUserIds = ko.observableArray();
  self.selectedInboxIds = ko.observableArray();
  self.inboxCount = ko.observable("0 selected");
  self.userCount = ko.observable("0 selected");
  self.tickets = ko.observableArray();
  self.meAvatar = ko.observable("images/pixel.png");
  self.meName = ko.observable();
  self.meEmail = ko.observable();
  self.threads = ko.observableArray();
  self.threadSubject = ko.observable();
  self.selectInbox = function(inbox) {
    $("#inboxes a[data-id='" + inbox.id + "']").toggleClass("selected");
    if (self.selectedInboxes.indexOf(inbox) > -1) {
      return self.selectedInboxes.remove(inbox);
    } else {
      return self.selectedInboxes.push(inbox);
    }
  };
  self.selectUser = function(user) {
    $("#users a[data-id='" + user.id + "']").toggleClass("selected");
    if (self.selectedUsers.indexOf(user) > -1) {
      return self.selectedUsers.remove(user);
    } else {
      return self.selectedUsers.push(user);
    }
  };
  self.filterTickets = function() {
    $(".placeholder, .tickets, .no-results").stop().animate({
      opacity: 0
    }, 200, function() {
      return $(this).hide();
    });
    $(".loader").stop().show().animate({
      opacity: 1
    }, 200);
    BigBrother.tickets.removeAll();
    $.ajax({
      url: siteHref + "/desk/v1/tickets/search.json",
      method: "POST",
      data: {
        "search": '',
        "searchType": "content",
        "inboxIds": BigBrother.selectedInboxIds(),
        "assignedTo": BigBrother.selectedUserIds().length ? BigBrother.selectedUserIds() : BigBrother.allUserIds(),
        "pageSize": $("#ticketCount").val(),
        "page": 1,
        "sortBy": "updatedAt",
        "sortDir": "asc",
        "statuses": ["solved", "closed"],
        "lastUpdated": $("#startDate").val()
      },
      headers: {
        "Authorization": "Basic " + btoa(APIKey + ":xxx")
      }
    }).done(function(data) {
      var mappedTickets;
      $(".loader").stop().animate({
        opacity: 0
      }, 200, function() {
        return $(this).hide();
      });
      if (data.tickets.length === 0) {
        $(".no-results").stop().show().animate({
          opacity: 1
        }, 200);
      } else {
        mappedTickets = $.map(data.tickets, function(ticket) {
          var agent, avatar;
          agent = ticket.assignedTo ? ticket.assignedTo.firstName + " " + ticket.assignedTo.lastName : "None";
          avatar = ticket.assignedTo ? $(".filters a[data-id='" + ticket.assignedTo.id + "'] img").attr("src") : null;
          ticket = new Ticket(ticket.id, agent, ticket.preview, ticket.subject, ticket.status, ticket.updatedAt, avatar);
          BigBrother.tickets.push(ticket);
        });
        $(".tickets").stop().show().animate({
          opacity: 1
        }, 200);
      }
    });
  };
  self.getThread = function(ticket) {
    var id, subject;
    id = ticket.id;
    subject = ticket.subject;
    $.ajax({
      url: siteHref + "/desk/v1/tickets/" + id + ".json",
      method: "GET",
      headers: {
        "Authorization": "Basic " + btoa(APIKey + ":xxx")
      }
    }).done(function(data) {
      var threads;
      threads = data.ticket.threads;
      BigBrother.threads(threads);
      BigBrother.threadSubject(subject);
      $("#thread").css("transform", "translateX(0)");
    });
  };
  self.closeThread = function() {
    $("#thread").css("transform", "translateX(100%)");
    BigBrother.threads.removeAll();
    BigBrother.threadSubject('');
  };
  self.reviewTickets = function(form) {
    var body;
    body = "<h5>What was done well?</h5>";
    body += "<p>" + ($(form).find(".donewell").val()) + "</p>";
    body += "<h5>Would you like to suggest any improvements?</h5>";
    body += "<p>" + ($(form).find(".improvements").val()) + "</p>";
    body += "<h5>Rating out of 5:</h5>";
    body += "<p>" + ($(form).find(".rating input:checked").val()) + "</p>";
    $(form).closest(".ticket").addClass("loading");
    $.ajax({
      url: siteHref + "/desk/v1/tickets/" + ($(form).find('.id').val()) + ".json",
      method: "POST",
      data: {
        "type": "note",
        "body": body
      },
      headers: {
        "Authorization": "Basic " + btoa(APIKey + ":xxx")
      }
    }).done(function(data) {
      $(form).closest(".ticket").removeClass("loading").addClass("success");
    });
  };
};

BigBrother = new FilterViewModel();

BigBrother.selectedInboxes.subscribe(function(inboxes) {
  var ids;
  ids = [];
  $(inboxes).each(function() {
    var inbox;
    inbox = this;
    return ids.push(inbox.id);
  });
  BigBrother.inboxCount(ids.length + " selected");
  return BigBrother.selectedInboxIds(ids);
});

BigBrother.selectedUsers.subscribe(function(users) {
  var ids;
  ids = [];
  $(users).each(function() {
    var user;
    user = this;
    return ids.push(user.id);
  });
  BigBrother.userCount(users.length + " selected");
  return BigBrother.selectedUserIds(ids);
});

login = function(APIKey, siteHref, storeKey) {
  window.APIKey = APIKey;
  siteHref = siteHref.trim().replace(/\/$/, "");
  window.siteHref = siteHref;
  $.ajax({
    url: siteHref + "/desk/v1/me.json",
    headers: {
      "Authorization": "Basic " + btoa(APIKey + ":xxx")
    }
  }).done(function(data) {
    BigBrother.meName(data.user.firstName + " " + data.user.lastName);
    BigBrother.meEmail(data.user.email);
    BigBrother.meAvatar(data.user.avatarURL);
    $(".login").hide();
    if (storeKey) {
      localStorage.setItem("APIKey", APIKey);
      localStorage.setItem("siteHref", siteHref);
    }
  }).fail(function(err) {
    console.log(err);
    $(".login").show();
    if (err.status === 404) {
      $(".login .err").show().text("Invalid site URL");
    } else {
      $(".login .err").show().text("Invalid API Key");
    }
    localStorage.removeItem("APIKey");
    return localStorage.removeItem("siteHref");
  });
  $.ajax({
    url: siteHref + "/desk/v1/inboxes.json",
    headers: {
      "Authorization": "Basic " + btoa(APIKey + ":xxx")
    }
  }).done(function(data) {
    var mappedInboxes;
    mappedInboxes = $.map(data.inboxes, function(inbox) {
      return new Inbox(inbox.name, inbox.id);
    });
    BigBrother.inboxes(mappedInboxes);
  });
  $.ajax({
    url: siteHref + "/desk/v1/users.json",
    headers: {
      "Authorization": "Basic " + btoa(APIKey + ":xxx")
    }
  }).done(function(data) {
    var mappedUsers;
    mappedUsers = $.map(data.users, function(user) {
      var name;
      name = user.firstName + " " + user.lastName;
      BigBrother.allUserIds.push(user.id);
      return new User(name, user.id, user.avatarURL);
    });
    BigBrother.users(mappedUsers);
  });
};

ko.applyBindings(BigBrother);

$(".filters h4").on("click", function() {
  if ($(this).hasClass("open")) {
    return $(".filters h4").removeClass("open");
  } else {
    $(".filters h4").removeClass("open");
    return $(this).addClass("open");
  }
});

$("#login-form").on("submit", function(e) {
  e.preventDefault();
  login($("#APIKey").val(), $("#siteHref").val(), true);
});

if (localStorage.getItem("APIKey") && localStorage.getItem("siteHref")) {
  login(localStorage.getItem("APIKey"), localStorage.getItem("siteHref"));
  $(".login").hide();
}

$("#logout").on("click", function(e) {
  e.preventDefault();
  localStorage.removeItem("APIKey");
  window.location = window.location.href;
});
