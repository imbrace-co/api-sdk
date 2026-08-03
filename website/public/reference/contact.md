# Contact Reference

`client.contacts` manages contacts — the leads, customers, or users who communicate through your channels. Each contact can have linked conversations, comments, files, and activity history.

---

## Schema

### Contact

| Field | Type | Description |
|-------|------|-------------|
| `object_name` | string? | Object type identifier |
| `id` | string | Unique contact ID |
| `organization_id` | string | Organization this contact belongs to |
| `display_name` | string? | Contact display name |
| `email` | string? | Email address |
| `phone_number` | string? | Phone number |
| `avatar_url` | string? | Profile picture URL |
| `created_at` | string | ISO 8601 creation timestamp |
| `updated_at` | string | ISO 8601 last-updated timestamp |

### UpdateContactInput

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | | Update display name |
| `email` | string | | Update email address |
| `phone` | string | | Update phone number |

### ContactComment

| Field | Type | Description |
|-------|------|-------------|
| `_id` | string | Unique comment ID |
| `text` | string? | Comment text body |
| `created_at` | string? | ISO 8601 creation timestamp |

### ContactFile

| Field | Type | Description |
|-------|------|-------------|
| `_id` | string | Unique file ID |
| `name` | string? | File name |
| `url` | string? | Download URL |
| `size` | number? | File size in bytes |

---

## Methods

| Method | TypeScript | Python | Description |
|--------|-----------|--------|-------------|
| List | `list` | `list` | Paginated list of contacts |
| Get | `get` | `get` | Get a contact by ID |
| Update | `update` | `update` | Update contact fields |
| Search | `search` | `search` | Full-text search across contacts |
| Export CSV | `exportCsv` | `export_csv` | Download all contacts as CSV |
| Get conversations | `getConversations` | `get_conversations` | List conversations for a contact |
| Get comments | `getComments` | `get_comments` | List internal comments on a contact |
| Get files | `getFiles` | `get_files` | List files attached to a contact |
| Get activities | `getActivities` | `get_activities` | Conversation activity log |
| Upload avatar | `uploadAvatar` | `upload_contacts` | Upload a file to contacts (avatar / file import) |
| List notifications | `listNotifications` | `list_notifications` | List notifications for current user |
| Mark notifications read | `markNotificationsRead` | `mark_notifications_read` | Mark notifications as read |
| Dismiss notification | `dismissNotification` | `dismiss_notification` | Dismiss a single notification |
| Dismiss all notifications | `dismissAllNotifications` | `dismiss_all_notifications` | Clear all notifications |

---

## list / list

**TypeScript**

```typescript
const page = await client.contacts.list({ limit: 50, skip: 0 });
for (const contact of page.data) {
  console.log(contact.id, contact.display_name, contact.email);
}
```

**Python**

```python
page = client.contacts.list(limit=50, skip=0)
for contact in page.get("data", []):
    print(contact["id"], contact.get("display_name"), contact.get("email"))
```

---

## search / search

**TypeScript**

```typescript
const results = await client.contacts.search({
  q: "alice@example.com",
  limit: 10,
});
```

**Python**

```python
results = client.contacts.search("alice@example.com")
```

---

## update / update

**TypeScript**

```typescript
const contact = await client.contacts.update("contact_id", {
  name: "Alice Smith",
  email: "alice@example.com",
  phone: "+84912345678",
});
```

**Python**

```python
contact = client.contacts.update("contact_id", {
    "name": "Alice Smith",
    "email": "alice@example.com",
    "phone": "+84912345678",
})
```

---

## getConversations / get_conversations

**TypeScript**

```typescript
const conversations = await client.contacts.getConversations("contact_id", {
  channelTypes: "whatsapp,web",
});
```

**Python**

```python
conversations = client.contacts.get_conversations(
    "contact_id",
    channel_types="whatsapp,web",
)
```

---

## getComments / get_comments

**TypeScript**

```typescript
const comments = await client.contacts.getComments("contact_id", {
  limit: 20,
  skip: 0,
});
```

**Python**

```python
comments = client.contacts.get_comments("contact_id", limit=20, skip=0)
```

---

## getActivities / get_activities

Returns the activity log for a conversation linked to this contact.

**TypeScript**

```typescript
const activities = await client.contacts.getActivities("conversation_id");
```

**Python**

```python
activities = client.contacts.get_activities("conversation_id")
```

---

## listNotifications / list_notifications

**TypeScript**

```typescript
const page = await client.contacts.listNotifications({ limit: 20, skip: 0 });
for (const n of page.data) {
  console.log(n);
}
```

**Python**

```python
page = client.contacts.list_notifications(limit=20, skip=0)
```

---

## markNotificationsRead / mark_notifications_read

**TypeScript**

```typescript
await client.contacts.markNotificationsRead(["notif_id_1", "notif_id_2"]);
```

**Python**

```python
client.contacts.mark_notifications_read()
```

---

## uploadAvatar / upload_contacts

**TypeScript**

```typescript
const formData = new FormData();
formData.append("file", avatarBlob, "avatar.png");
const result = await client.contacts.uploadAvatar(formData);
console.log(result.url);
```

**Python**

```python
with open("avatar.png", "rb") as f:
    result = client.contacts.upload_contacts(files={"file": f})
print(result)
```
