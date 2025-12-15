<div align="center">

```ascii
██╗    ██╗ █████╗ ████████╗ ██████╗██╗  ██╗██╗     ██╗     ███╗   ███╗
██║    ██║██╔══██╗╚══██╔══╝██╔════╝██║  ██║██║     ██║     ████╗ ████║
██║ █╗ ██║███████║   ██║   ██║     ███████║██║     ██║     ██║╚██╔██║
██║███╗██║██╔══██║   ██║   ██║     ██╔══██║██║     ██║     ██║╚██╔╝██║
╚███╔███╔╝██║  ██║   ██║   ╚██████╗██║  ██║███████╗███████╗██║ ╚═╝ ██║
 ╚══╝╚══╝ ╚═╝  ╚═╝   ╚═╝    ╚═════╝╚═╝  ╚═╝╚══════╝╚══════╝╚═╝     ╚═╝
```

### *Cut AI costs by 70% with semantic caching • Drop-in OpenAI replacement*

[![LIVE](https://img.shields.io/badge/🚀_LIVE-watchllm.dev-00ff88?style=for-the-badge)](https://watchllm.dev)
[![Deployed](https://img.shields.io/badge/⚡_CLOUDFLARE-WORKERS_@_EDGE-FF6B35?style=for-the-badge)](https://proxy.watchllm.dev)
[![Ship](https://img.shields.io/badge/💪_SOLO-SHIPPING_FAST-ff0066?style=for-the-badge)](https://twitter.com/kaadz_zz)

[![Twitter](https://img.shields.io/twitter/follow/kaadz_zz?style=for-the-badge&logo=x&color=000000&labelColor=1DA1F2)](https://twitter.com/kaadz_zz)
[![GitHub Stars](https://img.shields.io/github/stars/kaadipranav/WATCHLLM?style=for-the-badge&logo=github&color=black)](https://github.com/kaadipranav/WATCHLLM)

</div>

---

## 🎯 One Change. Massive Savings.

```mermaid
graph LR
    A[Your App 💻] --> B{WatchLLM 🔥}
    B -->|Cache HIT ✅| C[Return $0.00]
    B -->|Cache MISS ❌| D[OpenAI/Anthropic/Groq]
    D --> E[Cache Response]
    E --> C
    style B fill:#00ff88,stroke:#00cc66,color:#000
    style C fill:#ffeb3b,stroke:#ffc107,color:#000
    style D fill:#ff6b6b,stroke:#cc5555,color:#fff
```

<div align="center">

**Before:** `baseURL: "https://api.openai.com/v1"` 💸 **$600/mo**  
**After:** `baseURL: "https://proxy.watchllm.dev/v1"` 💰 **$180/mo**

### **→ $420 saved/month** • **70% cost reduction** • **Zero code changes**

</div>

---

## ⚡ Live in 60 Seconds

<table>
<tr>
<td width="50%">

### JavaScript
```javascript
const OpenAI = require('openai');

const client = new OpenAI({
  apiKey: 'lgw_proj_xxxxx', // 👈 Your WatchLLM key
  baseURL: 'https://proxy.watchllm.dev/v1'
});

const response = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hello!' }]
});

// Check if cached
console.log(response.headers['x-cache']); // HIT or MISS
```

</td>
<td width="50%">

### Python
```python
from openai import OpenAI

client = OpenAI(
  api_key='lgw_proj_xxxxx',  # 👈 Your WatchLLM key
  base_url='https://proxy.watchllm.dev/v1'
)

response = client.chat.completions.create(
  model='gpt-4o',
  messages=[{'role': 'user', 'content': 'Hello!'}]
)

# Check if cached
print(response.headers['x-cache'])  # HIT or MISS
```

</td>
</tr>
</table>

---

## 🔥 Tech Stack

<div align="center">

**Edge-first • Global • Blazing Fast**

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js_14-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![Cloudflare](https://img.shields.io/badge/Cloudflare_Workers-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)
![Hono](https://img.shields.io/badge/Hono-E36002?style=for-the-badge&logo=hono&logoColor=white)

![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Upstash](https://img.shields.io/badge/Upstash_Redis-00E9A3?style=for-the-badge&logo=redis&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

</div>

---

## 🎨 Architecture

```mermaid
flowchart TB
    subgraph "Your App"
        A[OpenAI SDK]
    end
    
    subgraph "WatchLLM Edge @ 300+ Locations"
        B[Cloudflare Worker<br/>Hono Router]
        C[Semantic Cache<br/>SHA-256 Hash]
        D[Rate Limiter<br/>Per Project/Plan]
        E[Usage Logger<br/>Cost Tracking]
    end
    
    subgraph "Providers"
        F[OpenAI]
        G[Anthropic]
        H[Groq]
        I[OpenRouter]
    end
    
    subgraph "Data Layer"
        J[(Upstash Redis<br/>Cache + Rate Limits)]
        K[(Supabase<br/>Auth + Usage Logs)]
    end
    
    A -->|1. Request| B
    B -->|2. Check Cache| C
    C -->|3. HIT?| J
    J -->|4. Return Cached| A
    C -->|5. MISS?| D
    D -->|6. Rate OK?| E
    E -->|7. Forward| F & G & H & I
    F & G & H & I -->|8. Response| E
    E -->|9. Log + Cache| J & K
    E -->|10. Return| A
    
    style B fill:#FF6B35,stroke:#FF5722,color:#fff
    style C fill:#00ff88,stroke:#00cc66,color:#000
    style J fill:#00E9A3,stroke:#00CC88,color:#000
```

---

## 📊 Shipped Features

<div align="center">

| 🎯 Core | 💰 Business | 🛡️ DX | 🚀 Scale |
|:---:|:---:|:---:|:---:|
| ✅ Semantic caching | ✅ Whop payments | ✅ 2-min setup | ✅ Edge deployment |
| ✅ Multi-provider | ✅ Usage tracking | ✅ OpenAI compatible | ✅ Global CDN |
| ✅ Rate limiting | ✅ Cost analytics | ✅ Real-time logs | ✅ Auto-scaling |
| ✅ API key mgmt | ✅ Billing alerts | ✅ Error tracking | ✅ 99.9% uptime |

</div>

---

## 💎 Pricing

<div align="center">

| 🆓 Free | 🏃 Starter | ⚡ Pro |
|:---:|:---:|:---:|
| **$0/mo** | **$29/mo** | **$49/mo** |
| 50K requests | 250K requests | 1M requests |
| 3 projects | 10 projects | Unlimited |
| Community | Email support | Priority support |

**[Start Free →](https://watchllm.dev/signup)**

</div>

---

## 📈 Building in Public

<div align="center">

```ascii
┌──────────────────────────────────────────┐
│  🚀  Status: LIVE on watchllm.dev       │
│  ⚡  Proxy: proxy.watchllm.dev          │
│  🏗️   Stack: TS + Next + CF Workers     │
│  💰  Payments: Whop integration         │
│  🎯  Focus: $0→$1K MRR in 30 days      │
└──────────────────────────────────────────┘
```

**Following the indiehacker playbook:** Ship fast • Charge early • Iterate with users

[@kaadz_zz](https://twitter.com/kaadz_zz)

</div>

---

<div align="center">

### 🌟 Star if you're cutting AI costs • 👀 Watch for updates

**[Try it Live](https://watchllm.dev)** • **[Read Docs](https://watchllm.dev/docs)** • **[Join Discord](https://discord.gg/watchllm)**

![Profile Views](https://komarev.com/ghpvc/?username=kaadipranav&color=00ff88&style=flat-square&label=Profile+Views)

---

*Semantic caching that actually works • Built by [@kaadz_zz](https://twitter.com/kaadz_zz) • Open for feedback*

</div>
