// src/build.ts
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// ../../packages/domain/src/ids.ts
var make = () => (value) => value;
var OrganizationId = make();
var CompanyId = make();
var MemberId = make();
var DepartmentId = make();
var AgentId = make();
var GoalId = make();
var InitiativeId = make();
var SignalId = make();
var ActionContractId = make();
var ApprovalId = make();
var RunId = make();
var EvidenceId = make();
var IntegrationId = make();
var TraceId = make();
var IdempotencyKey = make();
var Sha256 = make();
var Instant = (ms) => ms;

// ../../packages/domain/src/capability.ts
var CHANNELS = ["email", "voice", "sms"];
var RESERVED_RESOURCE_PREFIXES = ["communicate", ...CHANNELS].map(
  (segment) => `${segment}.`
);

// ../../packages/routes/src/index.ts
var HOSTS = {
  site: "https://orvayos.com",
  app: "https://app.orvayos.com",
  docs: "https://docs.orvayos.com",
  /**
   * Where a customer builds their website.
   *
   * On OUR domain, not on `orvay.app`, and the reason is worth stating because
   * the opposite looks tidier. The studio is an authenticated surface holding a
   * session cookie. Putting it on `orvay.app` would place it on the same
   * registrable domain as the tenant sites, and until the Public Suffix List
   * entry is live any tenant site can set a cookie with `Domain=orvay.app` that
   * the studio would then receive. Untrusted, model-authored content sharing a
   * cookie domain with an authenticated console is the one arrangement this
   * whole design exists to prevent.
   *
   * The live preview is an iframe pointing at `orvay.app`, so model-authored
   * code is cross-origin from this host at every stage, not merely after
   * publish.
   *
   * HANDOVER, S5 -> S6 (docs/plan/handoffs.md): S6 owns this package. This key
   * is added by S5 because `pnpm session` refuses to cut S6 until S5 has
   * merged, so this is a sequencing handover rather than shared ownership, the
   * same shape as the S1 -> S7 `wrangler.jsonc` handover the session plan
   * already blesses for exactly that reason.
   */
  studio: "https://studio.orvayos.com",
  /** Tenant artifacts only. Never Orvay's own content. */
  tenants: "https://orvay.app",
  /**
   * The public status page. THE ONLY HOST HERE NOT SERVED BY US.
   *
   * A subdomain of ours, deliberately pointed at GitHub Pages through a DNS-ONLY
   * record, so a Cloudflare Workers, KV, R2 or edge failure cannot take down the
   * page that reports it. Cloudflare does the same for itself:
   * `cloudflarestatus.com` answers `server: Google Frontend` and delegates to
   * `googledomains.com` nameservers.
   *
   * The record must stay grey cloud. Proxied, the request crosses Cloudflare's
   * edge on its way to Fastly and the page dies in the exact incident it was
   * moved to survive, with nothing anywhere able to detect the mistake: from a
   * browser, from the build and from every probe, a proxied record is
   * indistinguishable from a direct one. ADR-0023.
   */
  status: "https://status.orvayos.com"
};
var FORM_ORIGINS = [
  HOSTS.site,
  "https://www.orvayos.com",
  HOSTS.app,
  "http://localhost:3000",
  "http://localhost:3001"
];

// ../../packages/status/src/reading.ts
var LEVEL_ORDER = [
  "operational",
  "degraded",
  "partial-outage",
  "major-outage"
];
var levelRank = (level) => LEVEL_ORDER.indexOf(level);
var worstLevel = (levels) => levels.reduce(
  (worst, level) => worst === void 0 || levelRank(level) > levelRank(worst) ? level : worst,
  void 0
);
var isStale = (observedAt, now, budget) => now - observedAt > budget.staleAfterMs;
var displayFor = (reading, now, budget) => {
  switch (reading.method) {
    case "not-measured":
      return { kind: "not-measured", why: reading.why };
    case "vendor-reported":
      return {
        kind: "vendor",
        vendor: reading.vendor,
        state: reading.state,
        vendorUpdatedAt: reading.vendorUpdatedAt,
        fetchedAt: reading.fetchedAt,
        permalink: reading.permalink,
        // Absent counts as stale. A feed that will not say when it last changed
        // has not given us the thing that would make its state believable.
        feedStale: reading.vendorUpdatedAt === void 0 || isStale(reading.vendorUpdatedAt, now, budget)
      };
    case "probe":
    case "telemetry": {
      const { method, vantage, observedAt, observation } = reading;
      if (isStale(observedAt, now, budget)) {
        return { kind: "unknown", reason: "stale", method, vantage, observedAt };
      }
      if (observation.kind === "unknown") {
        return { kind: "unknown", reason: observation.reason, method, vantage, observedAt };
      }
      return {
        kind: "measured",
        level: observation.level,
        method,
        vantage,
        observedAt,
        latencyMs: observation.latencyMs,
        sampleCount: reading.method === "telemetry" ? reading.sampleCount : void 0
      };
    }
  }
};
var overallFrom = (displays) => {
  const ours = displays.filter((d) => d.kind !== "vendor");
  const levels = ours.flatMap((d) => d.kind === "measured" ? [d.level] : []);
  const unknown = ours.filter((d) => d.kind === "unknown").length;
  const notMeasured = ours.filter((d) => d.kind === "not-measured").length;
  const level = worstLevel(levels);
  if (level === void 0) return { kind: "unknown", unknown, notMeasured };
  return {
    kind: "known",
    level,
    complete: unknown === 0 && notMeasured === 0,
    measured: levels.length,
    unknown,
    notMeasured
  };
};

// ../../packages/status/src/components.ts
var MINUTE = 60 * 1e3;
var HOUR = 60 * MINUTE;
var COMPONENTS = [
  // -------------------------------------------------------------------------
  // Group A. Measured by us.
  // -------------------------------------------------------------------------
  {
    id: "sign-in",
    group: "measured",
    label: "Sign in",
    summary: "Reaching the login page and starting a session.",
    budget: { staleAfterMs: 20 * MINUTE }
  },
  {
    id: "control-plane",
    group: "measured",
    label: "Company control plane",
    summary: "The app where you review approvals, watch runs and read the audit trail.",
    budget: { staleAfterMs: 20 * MINUTE }
  },
  {
    id: "website-studio",
    group: "measured",
    label: "Website studio",
    summary: "Describing a website and watching it build.",
    budget: { staleAfterMs: 20 * MINUTE }
  },
  {
    id: "tenant-sites",
    group: "measured",
    label: "Published websites",
    summary: "Websites already published on orvay.app, served to your visitors.",
    budget: { staleAfterMs: 20 * MINUTE }
  },
  {
    id: "marketing-and-docs",
    group: "measured",
    label: "Public site and documentation",
    summary: "orvayos.com and the documentation.",
    budget: { staleAfterMs: 20 * MINUTE }
  },
  // The six that Phase 1 does not measure. Each says so.
  {
    id: "agent-runs",
    group: "measured",
    label: "Agent runs",
    summary: "Work being proposed and executed by agents.",
    budget: { staleAfterMs: 1 * HOUR },
    notMeasuredWhy: "Nothing watches this yet. Agent run health comes from real customer traffic rather than from an external check, and that measurement is not built."
  },
  {
    id: "independent-verification",
    group: "measured",
    label: "Independent verification",
    summary: "Checking finished work with a second, separate actor. This is a different row from agent runs on purpose: work can still be executing while nothing can be independently verified.",
    budget: { staleAfterMs: 1 * HOUR },
    notMeasuredWhy: "Nothing watches this yet. Verification health comes from real customer traffic rather than from an external check, and that measurement is not built."
  },
  {
    id: "scheduled-work",
    group: "measured",
    label: "Scheduled work",
    summary: "Background work that runs on a timer rather than when you ask for it.",
    budget: { staleAfterMs: 1 * HOUR },
    notMeasuredWhy: "Nothing watches this yet. A timer that stops is silent by nature, so this row needs a check that lives outside our own systems. It is not built."
  },
  {
    id: "evidence-archive",
    group: "measured",
    label: "Evidence archive",
    summary: "The off-site, tamper-evident copy of your audit trail.",
    budget: { staleAfterMs: 4 * HOUR },
    notMeasuredWhy: "Nothing watches this yet. The check is not built."
  },
  {
    id: "email-notifications",
    group: "measured",
    label: "Email notifications",
    summary: "Messages we send you about your own company. Listed separately because a failure here is the one failure you would not otherwise hear about.",
    budget: { staleAfterMs: 4 * HOUR },
    notMeasuredWhy: "Nothing watches this yet. The check is not built."
  },
  {
    id: "checkout-and-billing",
    group: "measured",
    label: "Checkout and billing",
    summary: "Starting a plan, changing a plan, and paying for one.",
    budget: { staleAfterMs: 4 * HOUR },
    notMeasuredWhy: "Nothing watches this yet. Checkout health has to come from real attempts rather than from a test payment, and that measurement is not built."
  },
  // -------------------------------------------------------------------------
  // Group B. Reported by a vendor. Mirrored, never measured.
  // -------------------------------------------------------------------------
  {
    id: "vendor-cloudflare",
    group: "vendor",
    label: "Cloudflare",
    summary: "Runs our application layer and our network.",
    budget: { staleAfterMs: 24 * HOUR }
  },
  {
    id: "vendor-supabase",
    group: "vendor",
    label: "Supabase",
    summary: "Runs the database that holds your company data, in Zurich.",
    budget: { staleAfterMs: 24 * HOUR }
  },
  {
    id: "vendor-anthropic",
    group: "vendor",
    label: "Anthropic",
    summary: "One of the two model providers Orvay calls.",
    budget: { staleAfterMs: 24 * HOUR }
  },
  {
    id: "vendor-openai",
    group: "vendor",
    label: "OpenAI",
    summary: "The second model provider, used for independent verification.",
    budget: { staleAfterMs: 24 * HOUR }
  },
  {
    id: "vendor-stripe",
    group: "vendor",
    label: "Stripe",
    summary: "Processes payments.",
    budget: { staleAfterMs: 24 * HOUR }
  },
  {
    id: "vendor-sentry",
    group: "vendor",
    label: "Sentry",
    summary: "Collects our error reports. A problem here affects us, not you.",
    budget: { staleAfterMs: 24 * HOUR }
  }
];

// ../../packages/content/src/legal.ts
var LEGAL_LAST_UPDATED = "2026-08-16";
var CONTROLLER = {
  name: "Valerio Amirani",
  form: "A natural person, and the sole operator of Orvay. There is no company.",
  street: "Wanderstrasse 19",
  postalCode: "4054",
  city: "Basel",
  country: "Switzerland",
  email: "valerio.amirani@zenovay.com",
  /** One sentence, used verbatim wherever the register question comes up. */
  register: "Not entered in any commercial register. A Swiss Kollektivgesellschaft (general partnership) is intended. It has not been formed, so there is no UID and no CHE number to give."
};
var POSTAL_ADDRESS = `${CONTROLLER.street}, ${CONTROLLER.postalCode} ${CONTROLLER.city}, ${CONTROLLER.country}`;
var SUB_PROCESSOR_STATUS_LABEL = {
  in_use: "In use today",
  configured: "Wired, and receiving only where its credential is set",
  not_engaged: "Named in the product, connected to nothing"
};
var PRIVACY_NOTICE = {
  id: "privacy",
  title: "Privacy notice",
  lead: "What we collect, why, where it goes, and what you can make us do about it. Orvay is run by one person, and the public website collects one thing: an email address, if you choose to give us one.",
  lastUpdated: LEGAL_LAST_UPDATED,
  sections: [
    {
      id: "controller",
      heading: "Who is responsible",
      blocks: [
        {
          kind: "text",
          text: `${CONTROLLER.name} is the controller for the processing described here. He is a natural person and the sole operator of Orvay. There is no company. A Swiss Kollektivgesellschaft is intended and has not been formed, so there is no commercial register entry and no UID number.`
        },
        {
          kind: "pairs",
          items: [
            { term: "Postal address", detail: POSTAL_ADDRESS },
            { term: "Email", detail: CONTROLLER.email }
          ]
        },
        {
          kind: "text",
          text: "Two laws apply at the same time. The Swiss Federal Act on Data Protection (revFADP, in German revDSG), in force since 1 September 2023, applies because we are in Switzerland. Regulation (EU) 2016/679 (GDPR) applies because we offer a service to people in the European Union. Where the two differ, this notice states both."
        },
        {
          kind: "text",
          text: "We hold no certification and we claim none. Not SOC 2, not ISO 27001, and no compliance badge of any kind. What follows is a description of what we actually do, written so that you can check it."
        }
      ]
    },
    {
      id: "collected",
      heading: "What we collect",
      blocks: [
        {
          kind: "text",
          text: "The public website collects one item of personal data, and only if you hand it over: the email address you type into the waitlist form."
        },
        {
          kind: "text",
          text: "Submitting that form writes a consent record. It holds your address in lower case, the exact wording of the consent sentence you were shown, the date and time, a label saying the address came from the waitlist form on our marketing site and has not been confirmed by a reply, and a SHA-256 digest of the address that we use to build your unsubscribe link. That is the whole record."
        },
        {
          kind: "text",
          text: "We do not ask for your name. We set no analytics cookie, run no tracking pixel, and use no third party analytics service on the public website. We do not buy addresses, and we do not enrich yours from any other source."
        },
        {
          kind: "text",
          text: "Cloudflare serves the website, and in doing so processes the technical details of every request, including your IP address. That happens whether or not you fill in the form, because it is how the page reaches you. Request logging is switched on, so those records are retained by Cloudflare under its own retention period."
        },
        {
          kind: "text",
          text: "If you sign in to the product, more is involved: a sign-in identity from the identity provider, and afterwards the records your company creates. This notice will be extended before that processing is anything other than an empty account, and the sub-processor list already names every service that would touch it."
        }
      ]
    },
    {
      id: "purposes",
      heading: "Why we process it, and on what basis",
      blocks: [
        {
          kind: "pairs",
          items: [
            {
              term: "Writing to you when Orvay launches",
              detail: "Your consent. GDPR Art. 6(1)(a), and consent under the revFADP. You gave it by submitting the form under the sentence we showed you, and we store that sentence word for word so the basis can be checked rather than asserted."
            },
            {
              term: "Keeping the record, including after you unsubscribe",
              detail: "Our obligation to be able to demonstrate consent, GDPR Art. 7(1) read with Art. 5(2). A record that we stopped is the only proof that we stopped."
            },
            {
              term: "Serving the website and keeping it available and secure",
              detail: "Our legitimate interest in running a working website, GDPR Art. 6(1)(f). Under the revFADP this processing needs no separate justification, because it does not breach the principles the Act sets out."
            },
            {
              term: "Signing you in, if you create an account",
              detail: "Performance of a contract with you, GDPR Art. 6(1)(b)."
            },
            {
              term: "Doing the work you ask an agent to do",
              detail: "Performance of a contract with you, GDPR Art. 6(1)(b). The text of your request is sent to a model vendor outside Switzerland and outside the EEA. See international transfers."
            }
          ]
        },
        {
          kind: "text",
          text: "There is no other purpose. We do not profile visitors, we do not build advertising audiences, and we sell nothing to anyone."
        }
      ]
    },
    {
      id: "automated",
      heading: "Automated decisions",
      blocks: [
        {
          kind: "text",
          text: "There is no automated decision with a legal or similarly significant effect on a visitor, and no profiling that produces one. Nothing on the public website engages GDPR Art. 22."
        },
        {
          kind: "text",
          text: "Inside the product, agents propose actions. An action with a legal or similarly significant effect on a person requires a recorded human approval before it can run, and the approval is stored as a scoped, bounded record rather than a flag. That record is the evidence of the human involvement."
        }
      ]
    },
    {
      id: "recipients",
      heading: "Who else sees it",
      blocks: [
        {
          kind: "text",
          text: "We use service providers. Each one is named in the sub-processor list, with what it receives, where it processes and the safeguard the transfer rests on."
        },
        {
          kind: "text",
          text: "We disclose personal data to nobody else. If an authority compelled disclosure we would follow the law, and we would tell you unless we were forbidden from telling you."
        }
      ]
    },
    {
      id: "transfers",
      heading: "Where the data goes",
      blocks: [
        {
          kind: "text",
          text: "Switzerland is not in the European Union and not in the European Economic Area. It is a third country holding an adequacy decision from the European Commission, and one from the United Kingdom. A transfer from the EEA or the UK to us therefore rests on adequacy and needs no further instrument."
        },
        {
          kind: "pairs",
          items: [
            {
              term: "Waitlist addresses, and every other database record",
              detail: "Stored in PostgreSQL in Zurich, Switzerland, in a project whose region is eu-central-2. Safeguard: the EU adequacy decision for Switzerland."
            },
            {
              term: "Evidence artifacts",
              detail: "Stored in an object storage bucket pinned to the EU jurisdiction, so those objects stay on EU infrastructure. Safeguard: the jurisdiction setting, plus the standard contractual clauses in the provider agreement."
            },
            {
              term: "Generated tenant websites, and the page cache",
              detail: "Stored in buckets created with a European location hint. A hint is a preference and not a guarantee, so we do not describe these as jurisdiction bound. Safeguard: the standard contractual clauses in the provider agreement."
            },
            {
              term: "Handling the request itself",
              detail: "Our code runs at the network edge, worldwide, so the request that renders a page may execute close to you rather than in Europe. Safeguard: the standard contractual clauses in the provider agreement."
            },
            {
              term: "Model prompts",
              detail: "Text sent to Anthropic and to OpenAI is processed in the United States, outside Switzerland and outside the EEA. Safeguard: the standard contractual clauses in each vendor agreement. Your waitlist address is never part of that text."
            }
          ]
        },
        {
          kind: "text",
          text: "Ask us which instrument a given provider relies on and we will send you what that provider publishes."
        }
      ]
    },
    {
      id: "retention",
      heading: "How long we keep it",
      blocks: [
        {
          kind: "text",
          text: "The consent ledger is append only. Each record is chained to the one before it by a hash, so removing a row would destroy the proof that the remaining rows are unmodified. Unsubscribing therefore writes a revocation onto your record instead of erasing it."
        },
        {
          kind: "text",
          text: "So the honest answer is this. We keep a waitlist record until you ask us to erase it, and there is no automatic expiry. No plan we sell carries a retention window, because nothing in the product enforces one yet. We would rather publish no number than a number nothing keeps."
        },
        {
          kind: "text",
          text: "Erasure is handled by hand. There is no self-service delete button. Write to us, we will do it, and we will tell you when it is done."
        }
      ]
    },
    {
      id: "rights",
      heading: "Your rights, and how to use them",
      blocks: [
        {
          kind: "text",
          text: `Every right below is exercised the same way. Email ${CONTROLLER.email} from the address you want us to act on, or tell us which address it concerns. We answer within 30 days, and it costs nothing.`
        },
        {
          kind: "pairs",
          items: [
            {
              term: "Access",
              detail: "Ask what we hold about you and we will send it. GDPR Art. 15, revFADP Art. 25."
            },
            {
              term: "Rectification",
              detail: "Tell us what is wrong and we will correct it. GDPR Art. 16, revFADP Art. 32."
            },
            {
              term: "Erasure",
              detail: "Ask us to delete your data and we will. GDPR Art. 17. Where the audit chain prevents removing a record, we destroy the personal data inside it and leave the remainder, which can still show that something happened and can no longer show what it said. The operator does this by hand."
            },
            {
              term: "Restriction",
              detail: "Ask us to stop processing while something is disputed and we will. GDPR Art. 18."
            },
            {
              term: "Portability",
              detail: "Ask for your data in a machine readable file and we will send it. GDPR Art. 20, revFADP Art. 28. This is a right, so it is free and it is available on every plan including the free one. We will never charge for it."
            },
            {
              term: "Objection",
              detail: "Object to processing we base on a legitimate interest, and we stop unless we can show grounds that override yours. GDPR Art. 21."
            },
            {
              term: "Withdrawing consent",
              detail: "Use the unsubscribe link in any message we send, or write to us. Withdrawal takes effect at once, and it does not make the processing before it unlawful. GDPR Art. 7(3)."
            }
          ]
        },
        {
          kind: "text",
          text: "An unsubscribe writes a revocation into the consent ledger. It does not merely flip a switch in a mailing tool, because an unsubscribe that leaves the consent standing is a lie told twice."
        }
      ]
    },
    {
      id: "complaints",
      heading: "Complaining about us",
      blocks: [
        {
          kind: "text",
          text: "You can complain to a supervisory authority, and you do not have to talk to us first. There are separate routes, and you may use whichever applies to you."
        },
        {
          kind: "pairs",
          items: [
            {
              term: "Switzerland",
              detail: "Federal Data Protection and Information Commissioner (FDPIC, in German EDOEB), Feldeggweg 1, 3003 Bern, Switzerland."
            },
            {
              term: "European Union",
              detail: "Your local supervisory authority: the one where you live, the one where you work, or the one where the problem happened. Each member state names its own, and any of the three may take your complaint."
            },
            {
              term: "United Kingdom",
              detail: "The Information Commissioner's Office."
            }
          ]
        }
      ]
    },
    {
      id: "eu-representative",
      heading: "Our EU representative, which we do not have yet",
      blocks: [
        {
          kind: "text",
          text: "GDPR Art. 27 requires a controller established outside the European Union that offers services to people inside it to appoint a representative in the Union. We are established in Switzerland, we offer a waitlist to people in the Union, and we have not appointed one. We are arranging it."
        },
        {
          kind: "text",
          text: "That sentence is on this page rather than left out. A privacy notice that says nothing about Art. 27 reads as though the duty did not exist. Until the appointment is made, writing to the address at the top of this page reaches the controller directly."
        },
        {
          kind: "text",
          text: "The mirror duty does not apply to us. Art. 14 revFADP requires a representative in Switzerland only from controllers domiciled abroad, and we are domiciled here."
        }
      ]
    },
    {
      id: "required",
      heading: "Whether you have to give us anything",
      blocks: [
        {
          kind: "text",
          text: "No. Nothing on the public website requires personal data. The waitlist form is the only place that asks for any, and the only consequence of leaving it empty is that we will not write to you when Orvay launches. There is no contract you fail to enter and no service you lose."
        }
      ]
    },
    {
      id: "security",
      heading: "How it is protected",
      blocks: [
        {
          kind: "list",
          items: [
            "The database is in Zurich, and the operator is the only person with credentials for it.",
            "Tenant data is isolated in the database by RESTRICTIVE row level security, so a query cannot see the rows of another company even if the application asks for them.",
            "The tenant identity is set inside the transaction and never on the connection, so a pooled connection cannot carry the scope of one tenant into the query of the next.",
            "The audit trail is append only and hash chained. A changed record is detectable rather than merely discouraged.",
            "The consent ledger grants the application no delete, and the stored wording of a consent cannot be rewritten.",
            "Session cookies are httpOnly and Secure.",
            "Secrets are held as deployment secrets. None of them are in the source code.",
            "The public marketing site holds no database binding at all, so no marketing page has a path to tenant data.",
            "Our providers encrypt data at rest and in transit as part of their own service."
          ]
        },
        {
          kind: "text",
          text: "We claim nothing beyond that. There is no penetration test report, no certification, and one person with access."
        }
      ]
    },
    {
      id: "changes",
      heading: "Changes to this notice",
      blocks: [
        {
          kind: "text",
          text: "The date at the top is when this text last changed. If a change affects what we do with data you have already given us, we will write to you at the address we hold before it takes effect. Otherwise the new version simply replaces this one."
        }
      ]
    }
  ]
};
var TERMS_OF_SERVICE = {
  id: "terms",
  title: "Terms of service",
  lead: "The agreement between you and the person who runs Orvay. It is short because the product is pre-launch and there is not much to agree about yet.",
  lastUpdated: LEGAL_LAST_UPDATED,
  sections: [
    {
      id: "parties",
      heading: "Who this is with",
      blocks: [
        {
          kind: "text",
          text: `This agreement is between you and ${CONTROLLER.name}, a natural person operating Orvay from ${POSTAL_ADDRESS}. There is no company. A Swiss Kollektivgesellschaft is intended and has not been formed. If it is formed, this agreement transfers to it, and we will tell you before that happens.`
        },
        {
          kind: "text",
          text: "Using our websites, joining the waitlist, or using the product means you accept these terms. If you do not accept them, do not use the service."
        },
        { kind: "hosts" }
      ]
    },
    {
      id: "service",
      heading: "What the service is",
      blocks: [
        {
          kind: "text",
          text: "Orvay is an operating system for running a company with AI agents. A company gives it goals, context, integrations, permissions and budgets. Orvay proposes work, gets it approved where approval is required, executes it, has the result verified by something other than the thing that did the work, and keeps an auditable record."
        },
        {
          kind: "text",
          text: "It is not a chatbot and it is not a coding assistant. An agent saying it finished is not proof that anything is finished, and the product exists because of that sentence."
        }
      ]
    },
    {
      id: "prelaunch",
      heading: "It is pre-launch, and the waitlist is not a purchase",
      blocks: [
        {
          kind: "text",
          text: "Orvay is not generally available. Joining the waitlist buys nothing, reserves nothing, and creates no entitlement to a place, a price or a launch date. No payment is taken. We may change the product, the plans and the prices before launch, and we may decide not to launch at all."
        },
        {
          kind: "text",
          text: "Anything shown as simulated did not touch an external system. We label it on the artifact itself, because a demonstration presented as a real run is a lie whatever the disclaimer at the bottom of the page says."
        }
      ]
    },
    {
      id: "account",
      heading: "Your account",
      blocks: [
        {
          kind: "text",
          text: "You are responsible for the security of your account and for everything done through it. Tell us as soon as you think somebody else has access. You must be old enough to enter into a contract where you live."
        }
      ]
    },
    {
      id: "acceptable-use",
      heading: "What you may not do",
      blocks: [
        {
          kind: "list",
          items: [
            "Break the law, or use Orvay to help somebody else break it.",
            "Send cold outreach, spam, or any message to a person who has given no basis for being contacted. The product refuses this at the consent gate, and doing it by another route is still a breach of these terms.",
            "Attack the service, probe it for weaknesses without asking us first, or try to reach data belonging to another customer.",
            "Resell the service, sublicense it, or run it for a third party without a written agreement with us.",
            "Try to make an agent take an action you could not lawfully take yourself.",
            "Upload personal data you have no lawful basis to hold."
          ]
        },
        {
          kind: "text",
          text: "We may suspend an account that is doing any of this. Where we can, we will tell you first and give you a chance to put it right. Where the harm is immediate we will suspend first and explain afterwards."
        }
      ]
    },
    {
      id: "your-instructions",
      heading: "What your agents do is your responsibility",
      blocks: [
        {
          kind: "text",
          text: "You decide what your agents may do. You set the goals, grant the capabilities, approve the actions that need approval, and set the budget. An action taken inside the authority you granted is your action, not ours."
        },
        {
          kind: "text",
          text: "This is not a disclaimer bolted on afterwards. The product is built so that the authority is explicit and the record shows who granted it. Read what you approve, because the approval record is the evidence that you did."
        },
        {
          kind: "text",
          text: "Some things are refused by the product and cannot be granted at all. Outbound telephone calls placed by an agent are one of them, permanently."
        }
      ]
    },
    {
      id: "ip",
      heading: "Who owns what",
      blocks: [
        {
          kind: "pairs",
          items: [
            {
              term: "Our software",
              detail: "The Orvay software, the design system, the documentation and the brand stay ours. Using the service gives you a limited, revocable, non-exclusive right to use it while your account is active, and nothing more."
            },
            {
              term: "Your content",
              detail: "Everything you put in stays yours: your goals, your documents, your contacts, your policies. We claim no ownership of it, and we do not use it to train models."
            },
            {
              term: "Work product",
              detail: "What the product makes for you, including generated websites, copy and code, is yours. We claim no ownership of the output."
            },
            {
              term: "Feedback",
              detail: "If you send us an idea for the product we may use it without owing you anything. Do not send us anything confidential as feedback."
            }
          ]
        },
        {
          kind: "text",
          text: "Exporting your personal data is a right, so it is free on every plan including the free one. Exporting a generated website is a product feature, and it is part of what a paid plan buys. We keep those two apart deliberately, and we say which is which on the pricing page rather than after you have paid."
        }
      ]
    },
    {
      id: "availability",
      heading: "Availability",
      blocks: [
        {
          kind: "text",
          text: "We promise no uptime. There is no service level agreement, no guaranteed support response time, and one person operating the service. When we can offer those, we will write them down and charge for them."
        },
        {
          kind: "text",
          text: "We may change or withdraw features. If a change removes something you rely on, we will give you notice and, where the change is material, a way out."
        }
      ]
    },
    {
      id: "money",
      heading: "Money",
      blocks: [
        {
          kind: "text",
          text: "Nothing is charged today. When plans go on sale, the price, what it includes and every limit will be stated on the pricing page before you pay, not after. Quota is measured in what your usage actually costs us, and credits are how that is displayed. The free plan stops when its allowance is gone and never runs up a bill."
        }
      ]
    },
    {
      id: "warranty",
      heading: "What we do not promise",
      blocks: [
        {
          kind: "text",
          text: "The service is provided as it is. So far as Swiss law permits, we give no warranty that it will be uninterrupted or error free, that it is fit for a particular purpose, or that any output is correct."
        },
        {
          kind: "text",
          text: "Verification is an independence mechanism, not an oracle. A verified result means a second actor checked the first one and the evidence was recorded. It does not mean the outcome is guaranteed correct, and we do not sell it as one."
        }
      ]
    },
    {
      id: "liability",
      heading: "Liability, honestly",
      blocks: [
        {
          kind: "text",
          text: "Swiss law does not allow us to exclude liability for unlawful intent or for gross negligence in advance. Art. 100(1) of the Swiss Code of Obligations makes such a clause void. We have not written one."
        },
        {
          kind: "text",
          text: "For slight negligence, our liability is limited to what you paid us in the twelve months before the event, and we are not liable for indirect or consequential loss, for lost profit, or for lost data beyond what we can restore from our own archive. Today that amount is zero, because nothing is charged."
        },
        {
          kind: "text",
          text: "Nothing here limits liability for death or personal injury, or any other liability that cannot be limited under the law that applies to you. If you are a consumer, the mandatory consumer protection of your own country still applies, and these terms do not take it away."
        }
      ]
    },
    {
      id: "termination",
      heading: "Ending it",
      blocks: [
        {
          kind: "text",
          text: "You can stop using the service at any time and ask us to close your account. We will export your data on request first."
        },
        {
          kind: "text",
          text: "We can end this agreement if you breach these terms and do not put it right within a reasonable time after we ask, or immediately where the breach is serious. We can also end it on 30 days notice if we stop offering the service."
        },
        {
          kind: "text",
          text: "When it ends we return or delete your data on request. The audit chain that proves what happened cannot be deleted without destroying that proof, so the personal data inside it is destroyed instead and the remainder stays."
        }
      ]
    },
    {
      id: "changes",
      heading: "Changing these terms",
      blocks: [
        {
          kind: "text",
          text: "We can change these terms, and the date at the top says when they last changed. For a change that materially affects you we will give at least 30 days notice by email to the address on your account, or on the website if you have no account. Continuing to use the service after the change takes effect means you accept it. If you do not accept it, stop using the service and ask us to close your account."
        }
      ]
    },
    {
      id: "law",
      heading: "Law and forum",
      blocks: [
        {
          kind: "text",
          text: "Swiss law applies, without its conflict of law rules and without the United Nations Convention on Contracts for the International Sale of Goods."
        },
        {
          kind: "text",
          text: "The courts of Basel, Switzerland have jurisdiction. If you are a consumer this does not remove your right to bring a claim in the courts where you live, or the protection of the mandatory law there. The Lugano Convention gives you that, and we are not trying to contract around it."
        },
        {
          kind: "text",
          text: "If a clause here turns out to be invalid, the rest stays in force."
        }
      ]
    },
    {
      id: "contact",
      heading: "Contact",
      blocks: [
        {
          kind: "pairs",
          items: [
            { term: "Email", detail: CONTROLLER.email },
            { term: "Post", detail: `${CONTROLLER.name}, ${POSTAL_ADDRESS}` }
          ]
        }
      ]
    }
  ]
};
var IMPRINT = {
  id: "imprint",
  title: "Imprint",
  lead: "Who runs this website, and where to reach them.",
  lastUpdated: LEGAL_LAST_UPDATED,
  sections: [
    {
      id: "provider",
      heading: "Provider",
      blocks: [
        {
          kind: "pairs",
          items: [
            { term: "Responsible person", detail: CONTROLLER.name },
            { term: "Legal form", detail: CONTROLLER.form },
            { term: "Address", detail: POSTAL_ADDRESS },
            { term: "Email", detail: CONTROLLER.email }
          ]
        },
        { kind: "hosts" },
        {
          kind: "text",
          text: "Art. 3(1)(s) of the Swiss Federal Act against Unfair Competition requires anyone offering something over the internet to give a clear statement of identity and a contact address. This page is that statement."
        }
      ]
    },
    {
      id: "register",
      heading: "Commercial register",
      blocks: [
        { kind: "text", text: CONTROLLER.register },
        {
          kind: "text",
          text: "This page changes on the day that changes. Until then, the person named above is personally the provider of these sites."
        }
      ]
    },
    {
      id: "vat",
      heading: "VAT",
      blocks: [
        {
          kind: "text",
          text: "Not registered for Swiss VAT. There is no UID, so there is no VAT number. If that changes, the number appears here."
        }
      ]
    },
    {
      id: "editorial",
      heading: "Responsibility for the content",
      blocks: [
        {
          kind: "text",
          text: `${CONTROLLER.name} is responsible for the content of these sites, at the address above.`
        },
        {
          kind: "text",
          text: "Anything shown as simulated is a demonstration and did not touch an external system. We label it on the artifact itself rather than relying on a note at the bottom of a page."
        }
      ]
    },
    {
      id: "links",
      heading: "Links",
      blocks: [
        {
          kind: "text",
          text: "Where we link to a site we do not run, we do not control what it says and we take no responsibility for it. Tell us if a link is broken or points somewhere it should not."
        }
      ]
    },
    {
      id: "disputes",
      heading: "Dispute resolution",
      blocks: [
        {
          kind: "text",
          text: "We are not obliged to take part in proceedings before a consumer arbitration board, and we do not do so. Write to the address above and a person reads it."
        },
        {
          kind: "text",
          text: "We do not link to the online dispute resolution platform of the European Commission, and we make no claim about whether it is available. That platform was created for traders established in the European Union. We are established in Switzerland."
        }
      ]
    },
    {
      id: "security",
      heading: "Reporting a security problem",
      blocks: [
        {
          kind: "text",
          text: `Write to ${CONTROLLER.email}. The security contact page says what to include and what happens next.`
        }
      ]
    }
  ]
};
var SUB_PROCESSOR_NOTICE = {
  id: "subprocessors",
  title: "Sub-processors",
  lead: "Every third party that processes data for us: what it gets, where it processes, and whether it is receiving anything today.",
  lastUpdated: LEGAL_LAST_UPDATED,
  sections: [
    {
      id: "how-to-read",
      heading: "How to read this",
      blocks: [
        {
          kind: "text",
          text: "This list is derived from the deployment configuration rather than from memory: the bindings each Worker holds, the environment variables it may carry, and the vendor libraries in the codebase. Each entry carries one of three states."
        },
        {
          kind: "pairs",
          items: [
            {
              term: SUB_PROCESSOR_STATUS_LABEL.in_use,
              detail: "Data is flowing to this provider now."
            },
            {
              term: SUB_PROCESSOR_STATUS_LABEL.configured,
              detail: "The wiring is real, and whether anything reaches the provider depends on a credential set for that deployment. We list it because it may be receiving data."
            },
            {
              term: SUB_PROCESSOR_STATUS_LABEL.not_engaged,
              detail: "The name appears in the product and is connected to nothing. It receives no data at all."
            }
          ]
        },
        {
          kind: "text",
          text: "We keep the third state rather than deleting those rows. A vendor name that a customer can see in the product and cannot find on this list is what makes a sub-processor list untrustworthy."
        },
        {
          kind: "text",
          text: "Each provider uses its own sub-processors, for example the cloud infrastructure underneath a managed database. Each of them publishes its own list."
        }
      ]
    },
    {
      id: "list",
      heading: "The list",
      blocks: [{ kind: "subprocessors" }]
    },
    {
      id: "changes",
      heading: "Changing the list",
      blocks: [
        {
          kind: "text",
          text: "We give customers at least 30 days notice by email before a new sub-processor starts processing their personal data, and you may object in writing during that period on reasonable data protection grounds. If we cannot resolve the objection you may terminate the affected service without penalty. That commitment is part of the data processing agreement, not a courtesy."
        }
      ]
    }
  ]
};
var SECURITY_CONTACT = {
  email: CONTROLLER.email,
  /** BCP 47 tags, in the order we would prefer to read a report. */
  preferredLanguages: ["en", "de"],
  acknowledgeWithin: "72 hours",
  disclosureWindowDays: 90
};
var SECURITY_POLICY = {
  id: "security",
  title: "Security contact",
  lead: "How to report a vulnerability, and what happens after you do.",
  lastUpdated: LEGAL_LAST_UPDATED,
  sections: [
    {
      id: "report",
      heading: "Reporting",
      blocks: [
        {
          kind: "pairs",
          items: [
            { term: "Email", detail: SECURITY_CONTACT.email },
            { term: "Preferred languages", detail: "English, then German." }
          ]
        },
        {
          kind: "text",
          text: `Send what you found, how to reproduce it, and what you think the impact is. One person reads that address and will acknowledge within ${SECURITY_CONTACT.acknowledgeWithin}.`
        },
        {
          kind: "text",
          text: "Please do not test against data belonging to other people. If a proof needs a second account, ask and we will make one for you."
        }
      ]
    },
    {
      id: "scope",
      heading: "Scope",
      blocks: [
        {
          kind: "text",
          text: "The sites below, and the product behind them. Anything hosted by a provider on our behalf is theirs to receive, so report it to them and tell us as well."
        },
        { kind: "hosts" }
      ]
    },
    {
      id: "no-bounty",
      heading: "No bug bounty",
      blocks: [
        {
          kind: "text",
          text: "We do not pay for reports. This is one person before launch with no revenue, and pretending otherwise would waste your time. We will credit you if you want the credit, and we will tell you what we did about the report."
        }
      ]
    },
    {
      id: "disclosure",
      heading: "Disclosure",
      blocks: [
        {
          kind: "text",
          text: `Tell us first, and give us ${SECURITY_CONTACT.disclosureWindowDays} days before publishing. If we fix it sooner we will say so and you can publish then.`
        },
        {
          kind: "text",
          text: "If we go quiet, publish. Silence from us is not a reason for a vulnerability to stay secret."
        }
      ]
    },
    {
      id: "security-txt",
      heading: "security.txt",
      blocks: [
        {
          kind: "text",
          text: "The machine readable version of this page follows RFC 9116. It gives the contact address, the preferred languages, the canonical location of the file itself, and an expiry date after which it should not be trusted."
        }
      ]
    }
  ]
};

// ../../packages/content/src/index.ts
var BRAND = {
  name: "Orvay",
  legalName: "Orvay",
  category: "Autonomous Company Operating System",
  tagline: "Give your company a goal. Watch the work get done. And verified."
};

// src/targets.ts
var DEFAULT_THRESHOLDS = {
  // Measured from a laptop on 2026-08-18: site 75ms, docs 381ms, app 677ms.
  // A GitHub runner is a different network with different variance, so the
  // threshold sits well above the observed spread. A threshold tuned to a good
  // day produces a degraded row every time somebody else's network hiccups, and
  // a page that cries wolf is a page nobody reads.
  degradedAboveMs: 3e3,
  timeoutMs: 1e4
};
var TARGETS = [
  {
    component: "marketing-and-docs",
    url: HOSTS.site,
    // The tagline, from the package that owns it.
    bodyMarker: BRAND.tagline,
    expectStatus: 200,
    thresholds: DEFAULT_THRESHOLDS,
    checkCertificate: true
  },
  {
    component: "control-plane",
    url: HOSTS.app,
    bodyMarker: BRAND.category,
    expectStatus: 200,
    thresholds: DEFAULT_THRESHOLDS,
    checkCertificate: true
  },
  {
    component: "sign-in",
    url: `${HOSTS.app}/login`,
    // A class name rather than a heading. Copy changes; the auth form's own
    // class does not, and this marker exists to notice the form being gone.
    bodyMarker: "a-auth__title",
    expectStatus: 200,
    thresholds: DEFAULT_THRESHOLDS
  },
  {
    component: "website-studio",
    url: HOSTS.studio,
    bodyMarker: `${BRAND.name} studio`,
    expectStatus: 200,
    thresholds: DEFAULT_THRESHOLDS,
    checkCertificate: true
  },
  {
    component: "tenant-sites",
    url: HOSTS.tenants,
    bodyMarker: new URL(HOSTS.tenants).hostname,
    expectStatus: 200,
    thresholds: DEFAULT_THRESHOLDS,
    checkCertificate: true,
    headers: [
      {
        name: "cross-origin-resource-policy",
        contains: "cross-origin",
        because: "a sandboxed site could not load its own assets when this was same-origin, and the fix is only observable from outside"
      }
    ]
  }
];
var SECONDARY_TARGETS = [
  {
    component: "marketing-and-docs",
    url: HOSTS.docs,
    // The documentation index heading's id. Stable across prose edits.
    bodyMarker: 'id="documentation"',
    expectStatus: 200,
    thresholds: DEFAULT_THRESHOLDS,
    checkCertificate: true
  }
];
var ALL_TARGETS = [...TARGETS, ...SECONDARY_TARGETS];

// src/probe.ts
import { connect as tlsConnect } from "node:tls";
var USER_AGENT = `orvay-status-probe (+${HOSTS.status})`;
var VANTAGE = "github-actions";
var CONFIRMATIONS = 3;
var CONFIRMATION_DELAY_MS = 2e3;
var classifyError = (error) => {
  if (error instanceof Error && error.name === "TimeoutError") return "timeout";
  if (error instanceof Error && error.name === "AbortError") return "timeout";
  const cause = error instanceof Error ? error.cause : void 0;
  const code = cause !== null && typeof cause === "object" && "code" in cause ? String(cause.code) : "";
  if (code === "ENOTFOUND" || code === "EAI_AGAIN" || code === "ENODATA") return "dns-failure";
  if (code === "ECONNREFUSED") return "connection-refused";
  if (code === "UND_ERR_CONNECT_TIMEOUT" || code === "UND_ERR_HEADERS_TIMEOUT") return "timeout";
  if (code.startsWith("CERT_") || code.startsWith("ERR_TLS") || code === "DEPTH_ZERO_SELF_SIGNED_CERT" || code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE" || code === "SELF_SIGNED_CERT_IN_CHAIN") {
    return "tls-failure";
  }
  return "probe-errored";
};
var attempt = async (target, fetchImpl, clock) => {
  const started = clock();
  try {
    const response = await fetchImpl(target.url, {
      // A status page must see what a visitor sees, and a visitor is not served
      // from a cache we warmed. `no-store` also stops a runner-side cache
      // reporting a page that has since stopped being served.
      cache: "no-store",
      redirect: "follow",
      headers: {
        // Identifying the prober is a courtesy that also makes our own traffic
        // filterable out of analytics, so the page cannot inflate its own
        // visitor numbers.
        "user-agent": USER_AGENT,
        accept: "text/html,application/xhtml+xml"
      },
      signal: AbortSignal.timeout(target.thresholds.timeoutMs)
    });
    const body = await response.text();
    const latencyMs = clock() - started;
    const headers = {};
    response.headers.forEach((value, name) => {
      headers[name.toLowerCase()] = value;
    });
    return { kind: "responded", status: response.status, latencyMs, body, headers };
  } catch (error) {
    return { kind: "failed", failure: classifyError(error) };
  }
};
var gradeResponse = (target, responded) => {
  if (responded.status >= 500) return { level: "major-outage", note: `status ${responded.status}` };
  if (responded.status !== target.expectStatus) {
    return { level: "partial-outage", note: `status ${responded.status}` };
  }
  if (!responded.body.includes(target.bodyMarker)) {
    return { level: "partial-outage", note: "page did not contain its expected content" };
  }
  for (const assertion of target.headers ?? []) {
    const value = responded.headers[assertion.name.toLowerCase()] ?? "";
    if (!value.toLowerCase().includes(assertion.contains.toLowerCase())) {
      return { level: "partial-outage", note: `${assertion.name} is not as expected` };
    }
  }
  if (responded.latencyMs > target.thresholds.degradedAboveMs) {
    return { level: "degraded", note: "slower than usual" };
  }
  return { level: "operational" };
};
var sleep = (ms) => new Promise((resolve2) => {
  setTimeout(resolve2, ms);
});
var probeTarget = async (target, fetchImpl, clock, delay = sleep) => {
  let last = "probe-errored";
  for (let n = 1; n <= CONFIRMATIONS; n += 1) {
    const result = await attempt(target, fetchImpl, clock);
    if (result.kind === "responded") {
      const graded = gradeResponse(target, result);
      return { kind: "measured", level: graded.level, latencyMs: result.latencyMs, note: graded.note };
    }
    last = result.failure;
    if (n < CONFIRMATIONS) await delay(CONFIRMATION_DELAY_MS * n);
  }
  return { kind: "unreachable", failure: last, attempts: CONFIRMATIONS };
};
var applyPositiveControl = (readings) => {
  const anythingAnswered = [...readings.values()].some((r) => r.kind === "measured");
  const resolved = /* @__PURE__ */ new Map();
  for (const [key, reading] of readings) {
    if (reading.kind === "measured") {
      resolved.set(key, {
        kind: "measured",
        level: reading.level,
        latencyMs: reading.latencyMs,
        note: reading.note
      });
      continue;
    }
    resolved.set(
      key,
      anythingAnswered ? { kind: "measured", level: "major-outage", latencyMs: 0, note: reading.failure } : (
        // The prober is the suspect. Say so rather than declaring five
        // simultaneous outages from one machine's bad afternoon.
        { kind: "unknown", reason: "probe-errored" }
      )
    );
  }
  return resolved;
};
var certificateDaysRemaining = async (host, now, timeoutMs = 1e4) => new Promise((resolve2) => {
  const socket = tlsConnect({ host, port: 443, servername: host }, () => {
    const cert = socket.getPeerCertificate();
    socket.end();
    if (cert.valid_to === void 0) return resolve2(void 0);
    const expires = Date.parse(cert.valid_to);
    resolve2(Number.isNaN(expires) ? void 0 : (expires - now) / 864e5);
  });
  socket.setTimeout(timeoutMs, () => {
    socket.destroy();
    resolve2(void 0);
  });
  socket.on("error", () => {
    socket.destroy();
    resolve2(void 0);
  });
});

// src/vendors.ts
var VENDOR_FEEDS = [
  {
    component: "vendor-cloudflare",
    vendor: "Cloudflare",
    api: "https://www.cloudflarestatus.com/api/v2/status.json",
    permalink: "https://www.cloudflarestatus.com",
    shape: "statuspage-v2"
  },
  {
    component: "vendor-supabase",
    vendor: "Supabase",
    api: "https://status.supabase.com/api/v2/status.json",
    permalink: "https://status.supabase.com",
    shape: "statuspage-v2"
  },
  {
    component: "vendor-anthropic",
    vendor: "Anthropic",
    // Redirects to status.claude.com and the payload's `page.name` is "Claude"
    // rather than "Anthropic". The label shown to a reader is OURS, taken from
    // `vendor` above, so a vendor renaming their page cannot silently rename a
    // row on ours. Redirects are followed deliberately.
    api: "https://status.anthropic.com/api/v2/status.json",
    permalink: "https://status.claude.com",
    shape: "statuspage-v2"
  },
  {
    component: "vendor-openai",
    vendor: "OpenAI",
    api: "https://status.openai.com/api/v2/status.json",
    permalink: "https://status.openai.com",
    shape: "statuspage-v2"
  },
  {
    component: "vendor-stripe",
    vendor: "Stripe",
    // Not a Statuspage instance. A static object on CloudFront with its own
    // shape, and the one that proves why freshness is checked at all.
    api: "https://status.stripe.com/current",
    permalink: "https://status.stripe.com",
    shape: "stripe-current"
  },
  {
    component: "vendor-sentry",
    vendor: "Sentry",
    api: "https://status.sentry.io/api/v2/status.json",
    permalink: "https://status.sentry.io",
    shape: "statuspage-v2"
  }
];
var isRecord = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
var parseVendorPayload = (shape, raw) => {
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return void 0;
  }
  if (!isRecord(parsed)) return void 0;
  if (shape === "statuspage-v2") {
    const status = parsed["status"];
    const page = parsed["page"];
    if (!isRecord(status) || typeof status["description"] !== "string") return void 0;
    const updatedRaw = isRecord(page) ? page["updated_at"] : void 0;
    const updatedAt = typeof updatedRaw === "string" && !Number.isNaN(Date.parse(updatedRaw)) ? Instant(Date.parse(updatedRaw)) : void 0;
    return { state: status["description"], updatedAt };
  }
  const message = parsed["message"];
  if (typeof message !== "string") return void 0;
  const timeRaw = parsed["time"];
  const cleaned = typeof timeRaw === "string" ? timeRaw.replace(" @ ", " ").replace(/(\d)(AM|PM)/i, "$1 $2") : "";
  const parsedTime = Date.parse(cleaned);
  return {
    state: message,
    updatedAt: Number.isNaN(parsedTime) ? void 0 : Instant(parsedTime)
  };
};
var readVendorFeed = async (feed, fetchText2, clock) => {
  const raw = await fetchText2(feed.api);
  const now = clock();
  if (raw === void 0) {
    return {
      method: "not-measured",
      why: `We could not reach ${feed.vendor}'s status feed, so we cannot show what they are reporting. Their own page is linked and remains the source of record.`
    };
  }
  const parsed = parseVendorPayload(feed.shape, raw);
  if (parsed === void 0) {
    return {
      method: "not-measured",
      why: `${feed.vendor}'s status feed answered in a format we do not recognise, so we are not showing a state we cannot read. Their own page is linked and remains the source of record.`
    };
  }
  return {
    method: "vendor-reported",
    vendor: feed.vendor,
    state: parsed.state,
    vendorUpdatedAt: parsed.updatedAt,
    fetchedAt: now,
    permalink: feed.permalink
  };
};

// src/render.ts
var esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
var utc = (at) => {
  const d = new Date(at);
  const pad = (n) => String(n).padStart(2, "0");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${pad(d.getUTCDate())} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}, ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
};
var GLYPHS = {
  circle: '<circle cx="8" cy="8" r="5"/>',
  triangle: '<path d="M8 2.5 14 13H2Z"/>',
  square: '<rect x="3" y="3" width="10" height="10" rx="1"/>',
  cross: '<path d="M4 4 12 12M12 4 4 12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
  brokenRing: '<path d="M8 3a5 5 0 1 1-4.6 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  dashedRing: '<circle cx="8" cy="8" r="5" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="2.2 2.4"/>',
  arrow: '<path d="M3 8h9M8.5 4.5 12.5 8l-4 3.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
};
var LEVEL_STYLE = {
  operational: {
    word: "Operational",
    glyph: "circle",
    token: "var(--verified-text)",
    spoken: "Operational"
  },
  degraded: {
    word: "Degraded",
    glyph: "triangle",
    token: "var(--risk-medium-text)",
    spoken: "Degraded, slower or less reliable than usual"
  },
  "partial-outage": {
    word: "Partial outage",
    glyph: "square",
    token: "var(--risk-high-text)",
    spoken: "Partial outage, some of this is not working"
  },
  "major-outage": {
    word: "Major outage",
    glyph: "cross",
    token: "var(--risk-critical-text)",
    spoken: "Major outage, this is not working"
  }
};
var UNKNOWN_STYLE = {
  word: "Unknown",
  glyph: "brokenRing",
  // Deliberately neutral. An unknown is not a mild problem and not a mild
  // success, and giving it amber would rank it below a degradation it might
  // easily be hiding.
  token: "var(--fg-secondary)",
  spoken: "Unknown, we could not measure this"
};
var NOT_MEASURED_STYLE = {
  word: "Not measured",
  glyph: "dashedRing",
  token: "var(--fg-secondary)",
  spoken: "Not measured, nothing watches this yet"
};
var VENDOR_STYLE = {
  word: "Reported",
  glyph: "arrow",
  token: "var(--fg-secondary)",
  spoken: "Reported by the vendor, not measured by us"
};
var REASON_TEXT = {
  timeout: "the check timed out",
  "dns-failure": "the address did not resolve",
  "tls-failure": "the security certificate did not validate",
  "connection-refused": "the connection was refused",
  "unexpected-status": "the response was not what we expect",
  "body-marker-missing": "the page did not contain its expected content",
  "probe-errored": "our own check could not run, so this says nothing about the service",
  "artifact-unreachable": "we could not read our own internal report",
  "artifact-malformed": "our own internal report was not readable",
  stale: "the last measurement is too old to rely on"
};
var badge = (style, detail) => `
      <span class="state" style="color:${style.token}">
        <svg class="glyph" viewBox="0 0 16 16" aria-hidden="true" focusable="false" fill="currentColor">${GLYPHS[style.glyph]}</svg>
        <span class="state-word">${esc(style.word)}</span>
        <span class="sr-only">${esc(style.spoken)}${detail === void 0 ? "" : `. ${detail}`}</span>
      </span>`;
var methodNote = (display) => {
  switch (display.kind) {
    case "measured":
      return `Checked from outside our network at ${esc(utc(display.observedAt))}${display.latencyMs === void 0 || display.latencyMs <= 0 ? "" : `, answered in ${Math.round(display.latencyMs)} ms`}.`;
    case "unknown":
      return `Last attempt at ${esc(utc(display.observedAt))}: ${esc(REASON_TEXT[display.reason])}.`;
    case "vendor":
      return display.vendorUpdatedAt === void 0 ? `Read at ${esc(utc(display.fetchedAt))}. Their feed does not say when they last updated it.` : `Reported by them at ${esc(utc(display.vendorUpdatedAt))}. Read by us at ${esc(utc(display.fetchedAt))}.`;
    case "not-measured":
      return esc(display.why);
  }
};
var row = (label, summary, display, permalink) => {
  const style = display.kind === "measured" ? LEVEL_STYLE[display.level] : display.kind === "unknown" ? UNKNOWN_STYLE : display.kind === "vendor" ? VENDOR_STYLE : NOT_MEASURED_STYLE;
  const vendorState = display.kind === "vendor" ? `<p class="vendor-state">${esc(display.state)}${display.feedStale ? ' <span class="flag">Their feed has not changed recently, so treat this as out of date.</span>' : ""}</p>` : "";
  const link = permalink === void 0 ? "" : ` <a class="permalink" href="${esc(permalink)}" rel="noreferrer noopener">Their status page</a>`;
  return `
    <li class="row"${display.kind === "not-measured" ? ' data-unmeasured="true"' : ""}>
      <div class="row-main">
        <h3 class="row-label">${esc(label)}</h3>
        ${badge(style)}
      </div>
      <p class="row-summary">${esc(summary)}</p>
      ${vendorState}
      <p class="row-method">${methodNote(display)}${link}</p>
    </li>`;
};
var renderPage = (input) => {
  const now = input.generatedAt;
  const displays = /* @__PURE__ */ new Map();
  for (const spec of COMPONENTS) {
    const reading = input.readings[spec.id] ?? {
      method: "not-measured",
      why: spec.notMeasuredWhy ?? "Nothing watches this yet. This row is listed so its absence is visible rather than quiet."
    };
    displays.set(spec.id, displayFor(reading, now, spec.budget));
  }
  const overall = overallFrom([...displays.values()]);
  const overallStyle = overall.kind === "known" ? LEVEL_STYLE[overall.level] : UNKNOWN_STYLE;
  const overallHeadline = overall.kind === "known" ? overall.level === "operational" ? "Everything we measure is working" : `Something we measure is not working` : "We cannot currently tell you the state of the service";
  const completeness = overall.kind === "known" && !overall.complete ? `<p class="banner-caveat">This is a partial view. ${overall.measured} ${overall.measured === 1 ? "row is" : "rows are"} measured, ${overall.unknown} could not be measured just now, and ${overall.notMeasured} are not watched yet. A row we do not watch is listed below rather than left out.</p>` : overall.kind === "unknown" ? `<p class="banner-caveat">Nothing we watch reported successfully on the last run, which usually means our own checker failed rather than that everything is down. Until a check succeeds we will not guess.</p>` : "";
  const measuredRows = COMPONENTS.filter((c) => c.group === "measured").map((c) => row(c.label, c.summary, displays.get(c.id))).join("");
  const vendorRows = COMPONENTS.filter((c) => c.group === "vendor").map((c) => {
    const display = displays.get(c.id);
    return row(
      c.label,
      c.summary,
      display,
      display.kind === "vendor" ? display.permalink : void 0
    );
  }).join("");
  const fallback = input.fallbackChannel === void 0 ? "We have not yet published a second place to look. Until we do, this limitation is stated here rather than left for you to discover during an outage." : `If this page is unreachable, look at <a href="${esc(input.fallbackChannel.url)}" rel="noreferrer noopener">${esc(input.fallbackChannel.label)}</a>.`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(BRAND.name)} Status</title>
<meta name="description" content="Live operational status for ${esc(BRAND.name)}, with the way each row is measured stated beside it.">
<meta name="robots" content="index, follow">
<link rel="alternate" type="application/atom+xml" title="${esc(BRAND.name)} Status" href="/history.atom">
<style>
${input.tokensCss}

/* -------------------------------------------------------------------------
   The page itself. Every colour below is a token from the block above.
   ------------------------------------------------------------------------- */
*, *::before, *::after { box-sizing: border-box; }

body {
  margin: 0;
  background: var(--bg-canvas);
  color: var(--fg-primary);
  font: var(--o-text-body-15);
  font-weight: var(--o-weight-regular);
  -webkit-font-smoothing: antialiased;
}

.sr-only {
  position: absolute; width: 1px; height: 1px;
  padding: 0; margin: -1px; overflow: hidden;
  clip: rect(0 0 0 0); clip-path: inset(50%); white-space: nowrap; border: 0;
}

.wrap { max-width: 62rem; margin: 0 auto; padding: var(--o-space-6) var(--o-space-4) var(--o-space-8); }

header.masthead {
  display: flex; flex-wrap: wrap; align-items: baseline;
  gap: var(--o-space-2) var(--o-space-4);
  padding-bottom: var(--o-space-5);
}
.brand { font: var(--o-text-title-19); font-weight: var(--o-weight-strong); }
.masthead .kicker { font: var(--o-text-label-14); color: var(--fg-secondary); }

/* Banner ---------------------------------------------------------------- */
.banner {
  background: var(--bg-raised);
  border: 1px solid var(--line-rule);
  border-radius: var(--o-radius-md);
  padding: var(--o-space-5);
  display: flex; flex-direction: column; gap: var(--o-space-3);
}
.banner h1 { font: var(--o-text-display-32); font-weight: var(--o-weight-regular); margin: 0; text-wrap: balance; }
.banner-caveat, .banner-limit { margin: 0; color: var(--fg-secondary); max-width: 60ch; }
.banner-limit { border-top: 1px solid var(--line-rule); padding-top: var(--o-space-3); }

/* State badge ------------------------------------------------------------ */
.state { display: inline-flex; align-items: center; gap: var(--o-space-2); white-space: nowrap; }
.glyph { width: 1em; height: 1em; flex: none; }
.state-word { font: var(--o-text-label-14); font-weight: var(--o-weight-medium); letter-spacing: 0.01em; }

/* Sections and rows ------------------------------------------------------ */
section { margin-top: var(--o-space-7); }
section > h2 { font: var(--o-text-title-24); font-weight: var(--o-weight-regular); margin: 0 0 var(--o-space-2); }
section > .section-note { margin: 0 0 var(--o-space-4); color: var(--fg-secondary); max-width: 62ch; }

ul.rows { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 1px;
  background: var(--line-rule); border: 1px solid var(--line-rule); border-radius: var(--o-radius-md); overflow: hidden; }
.row { background: var(--bg-raised); padding: var(--o-space-4); display: flex; flex-direction: column; gap: var(--o-space-2); }

/* An unmeasured row is also carried by TEXTURE, reusing the provenance hatch,
   so it stays distinguishable in greyscale and in print where the neutral ink
   of "Not measured" and "Unknown" would otherwise converge. */
.row[data-unmeasured="true"] { background-image: var(--provenance-hatch); }

.row-main { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: var(--o-space-2) var(--o-space-4); }
.row-label { font: var(--o-text-title-19); font-weight: var(--o-weight-medium); margin: 0; }
.row-summary { margin: 0; color: var(--fg-secondary); max-width: 66ch; }
.row-method { margin: 0; font: var(--o-text-mono-13); color: var(--fg-secondary); }
.vendor-state { margin: 0; font-weight: var(--o-weight-medium); }
.flag { display: inline-block; font: var(--o-text-label-14); color: var(--risk-medium-text); }

a { color: var(--accent-text); text-underline-offset: 0.16em; }
a:focus-visible, :focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; border-radius: 3px; }
.permalink { font: var(--o-text-mono-13); }

/* Legend ----------------------------------------------------------------- */
dl.legend { display: grid; grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr)); gap: var(--o-space-3) var(--o-space-5); margin: 0; }
dl.legend div { display: flex; flex-direction: column; gap: var(--o-space-1); }
dl.legend dt { font: var(--o-text-label-14); font-weight: var(--o-weight-medium); }
dl.legend dd { margin: 0; color: var(--fg-secondary); }

footer { margin-top: var(--o-space-7); padding-top: var(--o-space-5); border-top: 1px solid var(--line-rule); color: var(--fg-secondary); display: flex; flex-direction: column; gap: var(--o-space-3); }
footer p { margin: 0; max-width: 66ch; }

@media print {
  /* The hatch and every glyph are ink, so they survive on their own. This is
     reinforcement, not the carrier. */
  .row, .banner, .state, .glyph { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  a[href]::after { content: " (" attr(href) ")"; font: var(--o-text-mono-13); }
}
</style>
</head>
<body>
<main class="wrap">

  <header class="masthead">
    <span class="brand">${esc(BRAND.name)}</span>
    <span class="kicker">Service status</span>
  </header>

  <div class="banner">
    <h1>${esc(overallHeadline)}</h1>
    ${badge(overallStyle)}
    ${completeness}
    <p class="banner-limit">This page runs on servers that are not ours and not the ones ${esc(BRAND.name)} runs on, so an outage of our application layer does not take it down. It still depends on our domain name resolving. ${fallback}</p>
  </div>

  <section>
    <h2>What we measure</h2>
    <p class="section-note">Each row says how it is known and when it was last checked. A row nothing watches says so, and is never shown as working.</p>
    <ul class="rows">${measuredRows}
    </ul>
  </section>

  <section>
    <h2>What our providers report</h2>
    <p class="section-note">${esc(BRAND.name)} depends on these companies. We mirror what each one publishes about itself and we do not measure them, so these rows carry no history and no percentage. Their own page is the source of record.</p>
    <ul class="rows">${vendorRows}
    </ul>
  </section>

  <section>
    <h2>How to read this page</h2>
    <dl class="legend">
      <div><dt>Checked</dt><dd>We ran a request from outside our own network and it either worked or it did not.</dd></div>
      <div><dt>Reported</dt><dd>A provider published this about themselves. We are repeating it, with the time they last updated it.</dd></div>
      <div><dt>Unknown</dt><dd>We tried and could not get an answer. This is not the same as working, and not the same as broken.</dd></div>
      <div><dt>Not measured</dt><dd>Nothing watches this yet. We list it so you can see the gap instead of assuming coverage.</dd></div>
    </dl>
  </section>

  <footer>
    <p>Where your data lives: the database holding your company data is in Zurich, Switzerland. Requests to the models we use are processed by Anthropic and OpenAI, outside Switzerland and outside the EU. The evidence archive is pinned to the EU.</p>
    <p>We publish no uptime percentage. Every number of that kind we could publish today would be derived from our own account of our own incidents, and we would rather show you what each check found and when.</p>
    <p>You can follow this page by feed at <a href="/history.atom">history.atom</a>. Email notifications are not available. There is no sign-up form here because there is nothing to sign up to.</p>
    <p>Page built ${esc(utc(input.generatedAt))}. The service itself is at <a href="${esc(HOSTS.site)}">${esc(HOSTS.site.replace("https://", ""))}</a>.</p>
  </footer>

</main>
</body>
</html>
`;
};

// src/feed.ts
var rfc3339 = (at) => new Date(at).toISOString();
var SPOKEN = {
  operational: "operational",
  degraded: "degraded",
  "partial-outage": "a partial outage",
  "major-outage": "a major outage",
  unknown: "unknown, because we could not measure it",
  "not-measured": "not measured",
  reported: "whatever the provider reports"
};
var entry = (e, origin) => `
  <entry>
    <id>tag:status,${rfc3339(e.at).slice(0, 10)}:${esc(e.component)}:${e.at}</id>
    <title>${esc(e.label)} is now ${esc(SPOKEN[e.to])}</title>
    <updated>${rfc3339(e.at)}</updated>
    <link rel="alternate" href="${esc(origin)}/"/>
    <content type="text">${esc(e.label)} changed from ${esc(SPOKEN[e.from])} to ${esc(SPOKEN[e.to])} at ${rfc3339(e.at)}.</content>
  </entry>`;
var renderFeed = (entries, generatedAt, origin) => {
  const newest = entries[0]?.at ?? generatedAt;
  return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${esc(BRAND.name)} Status</title>
  <subtitle>Changes to what we measure. Nothing is published here unless a state actually changed.</subtitle>
  <id>${esc(origin)}/</id>
  <link rel="self" href="${esc(origin)}/history.atom"/>
  <link rel="alternate" href="${esc(origin)}/"/>
  <updated>${rfc3339(newest)}</updated>${entries.slice(0, 200).map((e) => entry(e, origin)).join("")}
</feed>
`;
};

// src/history.ts
var stateOf = (display) => {
  switch (display.kind) {
    case "measured":
      return display.level;
    case "unknown":
      return "unknown";
    case "vendor":
      return "reported";
    case "not-measured":
      return "not-measured";
  }
};
var EMPTY_HISTORY = { schema: 1, entries: [] };
var isRecord2 = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
var readHistory = (raw) => {
  if (raw === void 0) return EMPTY_HISTORY;
  try {
    const parsed = JSON.parse(raw);
    if (!isRecord2(parsed) || parsed["schema"] !== 1) return EMPTY_HISTORY;
    const entries = parsed["entries"];
    if (!Array.isArray(entries)) return EMPTY_HISTORY;
    const clean = entries.filter(
      (e) => isRecord2(e) && typeof e["at"] === "number" && typeof e["component"] === "string" && typeof e["label"] === "string" && typeof e["from"] === "string" && typeof e["to"] === "string"
    );
    return { schema: 1, entries: clean };
  } catch {
    return EMPTY_HISTORY;
  }
};
var transitions = (previous, current, labels, at) => {
  const out = [];
  for (const [component, display] of current) {
    const before = previous[component];
    if (before === void 0) continue;
    const after = stateOf(display);
    if (before === after) continue;
    out.push({ at, component, label: labels[component] ?? component, from: before, to: after });
  }
  return out;
};
var append = (history, entries) => ({ schema: 1, entries: [...entries, ...history.entries] });

// src/build.ts
var here = dirname(fileURLToPath(import.meta.url));
var repoRoot = resolve(here, "..", "..", "..");
var sourceCommit = true ? "4054408" : "unknown";
var CERT_WARN_DAYS = 14;
var readIfPresent = async (path) => {
  try {
    return await readFile(path, "utf8");
  } catch {
    return void 0;
  }
};
var fetchText = async (url, timeoutMs = 12e3) => {
  try {
    const response = await fetch(url, {
      redirect: "follow",
      cache: "no-store",
      headers: { "user-agent": USER_AGENT },
      signal: AbortSignal.timeout(timeoutMs)
    });
    if (!response.ok) return void 0;
    return await response.text();
  } catch {
    return void 0;
  }
};
var foldOntoComponents = (resolved, targets, at) => {
  const byComponent = /* @__PURE__ */ new Map();
  const rank = {
    operational: 0,
    degraded: 1,
    "partial-outage": 2,
    "major-outage": 3
  };
  for (const target of targets) {
    const result = resolved.get(target.url);
    if (result === void 0) continue;
    const reading = result.kind === "measured" ? {
      method: "probe",
      vantage: VANTAGE,
      observedAt: at,
      observation: { kind: "ok", level: result.level, latencyMs: result.latencyMs }
    } : {
      method: "probe",
      vantage: VANTAGE,
      observedAt: at,
      observation: { kind: "unknown", reason: result.reason }
    };
    const existing = byComponent.get(target.component);
    if (existing === void 0) {
      byComponent.set(target.component, reading);
      continue;
    }
    const existingWorse = existing.method === "probe" && existing.observation.kind === "ok" && reading.method === "probe" && reading.observation.kind === "ok" && (rank[existing.observation.level] ?? 0) >= (rank[reading.observation.level] ?? 0);
    const existingIsUnknown = existing.method === "probe" && existing.observation.kind === "unknown";
    const incomingIsUnknown = reading.method === "probe" && reading.observation.kind === "unknown";
    if (existingIsUnknown && !incomingIsUnknown) {
      byComponent.set(target.component, reading);
    } else if (!existingWorse && !incomingIsUnknown) {
      byComponent.set(target.component, reading);
    }
  }
  return byComponent;
};
var main = async (outDir) => {
  const at = Instant(Date.now());
  const perTarget = /* @__PURE__ */ new Map();
  await Promise.all(
    ALL_TARGETS.map(async (target) => {
      const reading = await probeTarget(target, fetch, () => performance.now());
      perTarget.set(target.url, reading);
    })
  );
  const resolved = applyPositiveControl(perTarget);
  const readings = foldOntoComponents(resolved, ALL_TARGETS, at);
  for (const target of ALL_TARGETS.filter((t) => t.checkCertificate)) {
    const host = new URL(target.url).hostname;
    const days = await certificateDaysRemaining(host, at);
    if (days === void 0 || days > CERT_WARN_DAYS) continue;
    const existing = readings.get(target.component);
    if (existing?.method === "probe" && existing.observation.kind === "ok" && existing.observation.level === "operational") {
      readings.set(target.component, {
        ...existing,
        observation: { kind: "ok", level: "degraded", latencyMs: existing.observation.latencyMs }
      });
    }
  }
  await Promise.all(
    VENDOR_FEEDS.map(async (feed) => {
      readings.set(feed.component, await readVendorFeed(feed, (u) => fetchText(u), () => Instant(Date.now())));
    })
  );
  const previousRaw = await readIfPresent(join(outDir, "summary.json"));
  const previousStates = {};
  if (previousRaw !== void 0) {
    try {
      const prev = JSON.parse(previousRaw);
      Object.assign(previousStates, prev.states ?? {});
    } catch {
    }
  }
  const displays = /* @__PURE__ */ new Map();
  const states = {};
  const labels = {};
  for (const spec of COMPONENTS) {
    const reading = readings.get(spec.id) ?? {
      method: "not-measured",
      why: spec.notMeasuredWhy ?? "Nothing watches this yet."
    };
    const display = displayFor(reading, at, spec.budget);
    displays.set(spec.id, display);
    states[spec.id] = stateOf(display);
    labels[spec.id] = spec.label;
  }
  const history = append(
    readHistory(await readIfPresent(join(outDir, "history.json"))),
    transitions(previousStates, displays, labels, at)
  );
  const tokensCss = await readFile(
    join(repoRoot, "packages", "design-system", "src", "tokens.css"),
    "utf8"
  );
  const snapshot = {
    schema: 1,
    generatedAt: at,
    readings: Object.fromEntries(readings)
  };
  await mkdir(outDir, { recursive: true });
  await Promise.all([
    writeFile(join(outDir, "index.html"), renderPage({ generatedAt: at, readings: snapshot.readings, tokensCss })),
    writeFile(
      join(outDir, "summary.json"),
      `${JSON.stringify({ ...snapshot, states, sourceCommit }, null, 2)}
`
    ),
    writeFile(join(outDir, "history.json"), `${JSON.stringify(history, null, 2)}
`),
    writeFile(join(outDir, "history.atom"), renderFeed(history.entries, at, HOSTS.status)),
    // GitHub Pages needs this file to serve a custom domain, and it needs to be
    // in the published output rather than the source, because the output branch
    // is what Pages reads.
    writeFile(join(outDir, "CNAME"), `${new URL(HOSTS.status).hostname}
`),
    // Jekyll would otherwise try to process the output and drop files starting
    // with an underscore. Nothing here starts with one today, and relying on
    // that is exactly the sort of assumption that breaks quietly later.
    writeFile(join(outDir, ".nojekyll"), "")
  ]);
  const summary = [...displays.entries()].map(([id, d]) => `${id}: ${stateOf(d)}`).join("\n");
  console.log(
    `status built at ${new Date(at).toISOString()} from ${sourceCommit}
${summary}`
  );
};
var outArg = process.argv[2];
if (outArg !== void 0) {
  await main(resolve(outArg));
}
export {
  main
};
