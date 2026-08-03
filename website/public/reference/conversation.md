# Conversation Reference

`client.conversations` manages conversation threads between contacts and your team (or AI agent). Each conversation belongs to a [Channel](/reference/channel.md) and is linked to a [Contact](/reference/contact.md).

---

## Schema

### Conversation

| Field | Type | Description |
|-------|------|-------------|
| `object_name` | `"conversation"` | Object type discriminator |
| `id` | string | Unique conversation ID |
| `organization_id` | string | Organization this conversation belongs to |
| `business_unit_id` | string | Business unit ID |
| `channel_id` | string | The channel this conversation belongs to |
| `channel_type` | string | Channel platform type (see [Channel](/reference/channel.md)) |
| `contact_id` | string | Linked contact ID |
| `status` | string | Conversation status (e.g. `open`, `resolved`) |
| `name` | string | Conversation display name |
| `timestamp` | string | ISO 8601 timestamp of the most recent message |
| `users` | SimpleUser[] | Team members currently in this conversation |

---

## Methods

| Method | TypeScript | Python | Description |
|--------|-----------|--------|-------------|
| List | `list` | `list` | Paginated list of conversations |
| Get | `get` | `get` | Get a conversation by internal ID |
| Get by conversation ID | `getByConversationId` | — | Get by the public conversation ID |
| Search | `search` | `search` | Full-text search within a business unit |
| Get views count | `getViewsCount` | `get_views_count` | Count conversations per view/status |
| Create | `create` | `create` | Create a new conversation |
| Join | `join` | `join` | Join a conversation as a team member |
| Leave | `leave` | `leave` | Leave a conversation |
| Update status | `updateStatus` | `update_status` | Change the conversation status |
| Update name | `updateName` | — | Rename a conversation |
| Init video call | `initVideoCall` | — | Start a video call in a conversation |
| Assign team member | `assignTeamMember` | — | Assign a team member to the conversation |
| Remove team member | `removeTeamMember` | — | Remove a team member |
| Get invitable users | `getInvitableUsers` | — | List users that can be invited |

---

## list / list

**TypeScript**

```typescript
const page = await client.conversations.list({
  type: "open",
  q: "billing",
  limit: 20,
  skip: 0,
});
for (const conv of page.data) {
  console.log(conv.id, conv.name, conv.status);
}
```

**Python**

```python
page = client.conversations.list(type="open", q="billing", limit=20, skip=0)
for conv in page.get("data", []):
    print(conv["id"], conv.get("name"), conv.get("status"))
```

---

## search / search

**TypeScript**

```typescript
const results = await client.conversations.search({
  businessUnitId: "bu_id",
  q: "refund request",
  limit: 10,
});
```

**Python**

```python
results = client.conversations.search(
    business_unit_id="bu_id",
    q="refund request",
    limit=10,
)
```

---

## create / create

**TypeScript**

```typescript
const conversation = await client.conversations.create({
  channel_id: "channel_id",
  contact_id: "contact_id",
});
console.log(conversation.id);
```

**Python**

```python
conversation = client.conversations.create()
print(conversation["id"])
```

---

## join / join

**TypeScript**

```typescript
await client.conversations.join({ conversation_id: "conversation_id" });
```

**Python**

```python
client.conversations.join({"conversation_id": "conversation_id"})
```

---

## updateStatus / update_status

**TypeScript**

```typescript
await client.conversations.updateStatus({
  conversation_id: "conversation_id",
  status: "resolved",
});
```

**Python**

```python
client.conversations.update_status({
    "conversation_id": "conversation_id",
    "status": "resolved",
})
```

---

## assignTeamMember

**TypeScript**

```typescript
await client.conversations.assignTeamMember({
  conversation_id: "conversation_id",
  user_id: "agent_user_id",
});
```

Not available in Python SDK.

---

## leave / leave

**TypeScript**

```typescript
await client.conversations.leave({ conversation_id: "conversation_id" });
```

**Python**

```python
client.conversations.leave({"conversation_id": "conversation_id"})
```

---

## getByConversationId

**TypeScript**

```typescript
const conversation = await client.conversations.getByConversationId("public_conversation_id");
console.log(conversation.id, conversation.status);
```

Not available in Python SDK.

---

## getViewsCount / get_views_count

**TypeScript**

```typescript
const counts = await client.conversations.getViewsCount({ type: "open" });
console.log(counts);
```

**Python**

```python
counts = client.conversations.get_views_count(type="open")
print(counts)
```

---

## updateName

**TypeScript**

```typescript
await client.conversations.updateName({
  conversation_id: "conversation_id",
  name: "VIP Support Thread",
});
```

Not available in Python SDK.

---

## removeTeamMember

**TypeScript**

```typescript
await client.conversations.removeTeamMember({
  conversation_id: "conversation_id",
  user_id: "agent_user_id",
});
```

Not available in Python SDK.

---

## getInvitableUsers

**TypeScript**

```typescript
const users = await client.conversations.getInvitableUsers("conversation_id");
for (const u of users) {
  console.log(u._id, u.name);
}
```

Not available in Python SDK.

---

## initVideoCall

**TypeScript**

```typescript
const result = await client.conversations.initVideoCall({
  conversation_id: "conversation_id",
});
console.log(result.conversation);
```

Not available in Python SDK.
