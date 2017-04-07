window.APIKey = ""

Inbox = (name, id) ->
	self = this
	self.name = name
	self.id = id
	return

User = (name, id, avatar) ->
	self = this
	self.name = name
	self.id = id
	self.avatar = avatar
	return

Ticket = (id, agent, preview, subject, status, date, avatar) ->
	self = this
	self.id = id
	self.agent = agent
	self.preview = preview
	self.subject = subject
	self.status = status
	self.date = date
	self.avatar = avatar
	return

FilterViewModel = () ->
	self = this
	self.inboxes = ko.observableArray()
	self.users = ko.observableArray()
	self.selectedInboxes = ko.observableArray()
	self.selectedUsers = ko.observableArray()
	self.selectedUserIds = ko.observableArray()
	self.allUserIds = ko.observableArray()
	self.selectedInboxIds = ko.observableArray()
	self.inboxCount = ko.observable("0 selected")
	self.userCount = ko.observable("0 selected")
	self.tickets = ko.observableArray()
	self.meAvatar = ko.observable("images/pixel.png")
	self.meName = ko.observable()
	self.meEmail = ko.observable()

	self.selectInbox = (inbox) ->
		$("#inboxes a[data-id='#{inbox.id}']").toggleClass "selected"
		if self.selectedInboxes.indexOf(inbox) > -1
			self.selectedInboxes.remove(inbox)
		else
			self.selectedInboxes.push(inbox)

	self.selectUser = (user) ->
		$("#users a[data-id='#{user.id}']").toggleClass "selected"
		if self.selectedUsers.indexOf(user) > -1
			self.selectedUsers.remove(user)
		else
			self.selectedUsers.push(user)

	self.filterTickets = () ->
		$(".placeholder, .tickets, .no-results").stop().animate {opacity: 0}, 200, () ->
			$(this).hide()
		$(".loader").stop().show().animate {opacity: 1}, 200
		BigBrother.tickets.removeAll()
		$.ajax({
			url: "https://digitalcrew.teamwork.com/desk/v1/tickets/search.json",
			method: "POST",
			data: {
				"search": '',
				"searchType": "content",
				"inboxIds": BigBrother.selectedInboxIds(),
				"assignedTo": if BigBrother.selectedUserIds().length then BigBrother.selectedUserIds() else BigBrother.allUserIds(),
				"pageSize": $("#ticketCount").val(),
				"page": 1,
				"sortBy": "updatedAt",
				"sortDir": "asc",
				"statuses": ["solved","closed"],
				"lastUpdated": $("#startDate").val()
			}
			headers: {
				"Authorization": "Basic " + btoa(APIKey + ":xxx")
			}
		}).done (data) ->
			$(".loader").stop().animate {opacity: 0}, 200, () ->
				$(this).hide()
			if data.tickets.length is 0
				$(".no-results").stop().show().animate {opacity: 1}, 200
			else
				mappedTickets = $.map data.tickets, (ticket) ->
					agent = if ticket.assignedTo then ticket.assignedTo.firstName + " " + ticket.assignedTo.lastName else "None"
					avatar = if ticket.assignedTo then $(".filters a[data-id='#{ticket.assignedTo.id}'] img").attr("src") else null
					ticket = new Ticket(ticket.id, agent, ticket.preview, ticket.subject, ticket.status, ticket.updatedAt, avatar)
					BigBrother.tickets.push(ticket)
					return
				$(".tickets").stop().show().animate {opacity: 1}, 200
			return
		return

	self.reviewTickets = (form) ->
		body = "<h5>What was done well?</h5>"
		body += "<p>#{$(form).find(".donewell").val()}</p>"
		body += "<h5>Would you like to suggest any improvements?</h5>"
		body += "<p>#{$(form).find(".improvements").val()}</p>"
		body += "<h5>Rating out of 5:</h5>"
		body += "<p>#{$(form).find(".rating input:checked").val()}</p>"
		$(form).closest(".ticket").addClass("loading")
		$.ajax({
			url: "https://digitalcrew.teamwork.com/desk/v1/tickets/#{$(form).find('.id').val()}.json",
			method: "POST",
			data: {
				"type": "note",
				"body": body
			}
			headers: {
				"Authorization": "Basic " + btoa(APIKey + ":xxx")
			}
		}).done (data) ->
			$(form).closest(".ticket").removeClass("loading").addClass("success")
			return
		return

	return

BigBrother = new FilterViewModel()

BigBrother.selectedInboxes.subscribe (inboxes) ->
	ids = []
	$(inboxes).each ->
		inbox = this
		ids.push inbox.id
	BigBrother.inboxCount(ids.length + " selected")
	BigBrother.selectedInboxIds(ids)

BigBrother.selectedUsers.subscribe (users) ->
	ids = []
	$(users).each ->
		user = this
		ids.push user.id
	BigBrother.userCount(users.length + " selected")
	BigBrother.selectedUserIds(ids)

init = (APIKey, storeKey) ->
	window.APIKey = APIKey
	$.ajax({
		url: "https://digitalcrew.teamwork.com/desk/v1/me.json",
		headers: {
			"Authorization": "Basic " + btoa(APIKey + ":xxx")
		}
	}).done (data) ->
		BigBrother.meName(data.user.firstName + " " + data.user.lastName)
		BigBrother.meEmail(data.user.email)
		BigBrother.meAvatar(data.user.avatarURL)
		$(".login").hide()
		if storeKey
			localStorage.setItem "APIKey", $("#APIKey").val()
		return
	.fail ->
		$(".login").show()
		$(".login p").text "Invalid API Key!"

	$.ajax({
		url: "https://digitalcrew.teamwork.com/desk/v1/inboxes.json",
		headers: {
			"Authorization": "Basic " + btoa(APIKey + ":xxx")
		}
	}).done (data) ->
		mappedInboxes = $.map data.inboxes, (inbox) ->
			return new Inbox(inbox.name,inbox.id)
		BigBrother.inboxes(mappedInboxes)
		return

	$.ajax({
		url: "https://digitalcrew.teamwork.com/desk/v1/users.json",
		headers: {
			"Authorization": "Basic " + btoa(APIKey + ":xxx")
		}
	}).done (data) ->
		mappedUsers = $.map data.users, (user) ->
			name = user.firstName + " " + user.lastName
			BigBrother.allUserIds.push(user.id)
			return new User(name,user.id,user.avatarURL)
		BigBrother.users(mappedUsers)
		return

	ko.applyBindings BigBrother
	return

$(".filters h4").on "click", ->
	if $(this).hasClass("open")
		$(".filters h4").removeClass "open"
	else
		$(".filters h4").removeClass "open"
		$(this).addClass "open"

$("#login-form").on "submit", (e) ->
	e.preventDefault()
	init $("#APIKey").val(), true
	return

if localStorage.getItem "APIKey"
	init(localStorage.getItem "APIKey")
	$(".login").hide()

$("#logout").on "click", (e) ->
	e.preventDefault()
	localStorage.removeItem "APIKey"
	window.location = window.location.href
	return