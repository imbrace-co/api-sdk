# Resource Reference

This page covers the CRM and messaging namespaces exposed by the SDK. Initialize the client first (see [Installation](/sdk/installation.md) or [Quick Start](/sdk/quick-start.md)). All snippets below assume `client` is the initialized instance.

For AI and workflow-related resources, see:
- [AI Agent](/sdk/ai-agent.md) — AI agents (`chatAi`), AI agent streaming, embeddings, parquet
- [Workflows](/sdk/workflows.md) — Workflow flows and channel automation
- [Data Boards](/sdk/databoard.md) — CRM pipeline boards and items

For an end-to-end walkthrough that uses these resources together, see [Full Flow Guide](/sdk/full-flow-guide.md).

---

## Contacts — `client.contacts`

**TypeScript**

```typescript
const { data: contacts } = await client.contacts.list({ limit: 50 });
const contact = await client.contacts.get("contact_id");

await client.contacts.update("contact_id", {
  name: "Alice B.",
  email: "alice@example.com",
  phone: "+84901234567",
});

const comments = await client.contacts.getComments("contact_id");
const files    = await client.contacts.getFiles("contact_id");
const activity = await client.contacts.getActivities("conversation_id");
```

**Python**

```python
result   = client.contacts.list(limit=50)
contacts = result.get("data", [])

contact = client.contacts.get("contact_id")

client.contacts.update("contact_id", {
    "name":  "Alice B.",
    "email": "alice@example.com",
    "phone": "+84901234567",
})

comments  = client.contacts.get_comments("contact_id")
files     = client.contacts.get_files("contact_id")
activity  = client.contacts.get_activities("conversation_id")
```

---

## Conversations — `client.conversations`

**TypeScript**

```typescript
// Search
const { data: convs } = await client.conversations.search({
  businessUnitId: "bu_xxx",
  q: "support",
  limit: 20,
});

// Outstanding (unresolved)
const { data: open } = await client.conversations.getOutstanding({
  businessUnitId: "bu_xxx",
  limit: 50,
});

// Assign
await client.conversations.assignTeamMember({
  conversation_id: "conv_xxx",
  user_id: "user_xxx",
});

// Update status
await client.conversations.updateStatus({
  conversation_id: "conv_xxx",
  status: "resolved",
});
```

**Python**

```python
result = client.conversations.search(
    business_unit_id="bu_xxx",
    q="support",
    limit=20,
)
convs = result.get("data", [])

all_convs = client.conversations.list(limit=50).get("data", [])

client.conversations.update_status({
    "conversation_id": "conv_xxx",
    "status": "resolved",
})
```

---

## Messaging — `client.channel`, `client.messages`

**TypeScript**

```typescript
const channels = await client.channel.list();

await client.messages.send({
  type: "text",
  text: "Hello, how can I help you today?",
});

const msgs = await client.messages.list({ limit: 20 });
```

**Python**

```python
channels = client.channel.list()

client.messages.send(
    type="text",
    text="Hello, how can I help you today?",
)

msgs = client.messages.list(limit=20)
```

---

## Campaigns & touchpoints — `client.campaign`

**TypeScript**

```typescript
const { data: campaigns } = await client.campaign.list();
const campaign  = await client.campaign.get("campaign_id");
const newCamp   = await client.campaign.create({ name: "Q2 Outreach", channel_type: "email" });
await client.campaign.delete("campaign_id");

// Touchpoints
const { data: touchpoints } = await client.campaign.listTouchpoints();
const tp = await client.campaign.getTouchpoint("touchpoint_id");

await client.campaign.createTouchpoint({
  campaign_id: "campaign_id",
  type:        "email",
  delay_days:  3,
});
await client.campaign.updateTouchpoint("touchpoint_id", { delay_days: 5 });
await client.campaign.deleteTouchpoint("touchpoint_id");

// Validate touchpoint config before saving
const result = await client.campaign.validateTouchpoint({ type: "email", template_id: "tpl_xxx" });
```

**Python**

```python
campaigns = client.campaign.list().get("data", [])
campaign  = client.campaign.get("campaign_id")
new_camp  = client.campaign.create({"name": "Q2 Outreach", "channel_type": "email"})
client.campaign.delete("campaign_id")

# Touchpoints
touchpoints = client.campaign.list_touchpoints().get("data", [])
tp = client.campaign.get_touchpoint("touchpoint_id")

client.campaign.create_touchpoint({
    "campaign_id": "campaign_id",
    "type":        "email",
    "delay_days":  3,
})
client.campaign.update_touchpoint("touchpoint_id", {"delay_days": 5})
client.campaign.delete_touchpoint("touchpoint_id")

# Validate touchpoint config before saving
result = client.campaign.validate_touchpoint({"type": "email", "template_id": "tpl_xxx"})
```

---

## Message suggestion — `client.messageSuggestion` / `client.message_suggestion`

**TypeScript**

```typescript
const suggestions = await client.messageSuggestion.getSuggestions({
  message: "Can you help me with my order?",
  conversation_id: "conv_xxx",
  limit: 3,
});
```

**Python**

```python
suggestions = client.message_suggestion.get_suggestions({
    "message": "Can you help me with my order?",
    "conversation_id": "conv_xxx",
    "limit": 3,
})
```

---

## Predict — `client.predict`

**TypeScript**

```typescript
const result = await client.predict.predict({
  model: "lead_score_v1",
  input: { company_size: 200, industry: "saas", mrr: 5000 },
});
console.log(result.score);   // 0.87
```

**Python**

```python
result = client.predict.predict({
    "model": "lead_score_v1",
    "input": {"company_size": 200, "industry": "saas", "mrr": 5000},
})
print(result["score"])   # 0.87
```
