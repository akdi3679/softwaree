# Launch Blog Post - Draft

> **Status:** Draft. Edit before publishing. Fill `<placeholders>`.

---

## Title options

- Why your medical software should not be in someone else's cloud
- Local-first software for clinics that cannot afford to lose data
- We built a medical platform where your data never leaves your clinic

---

## Body

**`<DATE>`** - Today we are launching `<PRODUCT_NAME>`, a desktop
platform for small clinics and laboratories that keeps your data on
your own devices.

### The problem

Most clinic software assumes the internet is always available and that
you trust your software vendor with patient data. Neither assumption
survives contact with a real clinic.

We have talked to doctors who:

- Lost a day of work when their SaaS went down for "scheduled
  maintenance" that was not scheduled.
- Could not open a patient record when their internet was out.
- Waited 45 minutes on hold to reset a password.
- Wondered, reasonably, what happens to their data if the vendor
  goes out of business.

### What we built

`<PRODUCT_NAME>` installs as a desktop app on the doctor's computer. It
runs a local database. It works when the internet does not.

There are two apps:

- **Admin** runs on the doctor's main computer. It holds the clinic's
  data. It is the source of truth.
- **User** runs on staff computers - phones, reception, lab bench. It
  holds a read-only copy of what each user is allowed to see.

The two apps talk to each other over your local network or over the
internet with end-to-end encryption. They do not route through our
servers. We literally cannot see your patient data.

### What stays in the cloud

We run a small cloud service that does four things:

1. It authenticates your users.
2. It registers your devices.
3. It signs the software modules you install.
4. It stores encrypted backups, so that if a laptop is stolen, you do
   not lose the clinic.

The cloud does not see patient names. It does not see lab results. It
does not see anything inside a patient record. It sees encrypted blobs
it cannot decrypt.

### What it costs

We charge per project per month. `<PRICING_URL>`.

There is a free tier for a single user who never needs cloud backup.
You can use it forever, offline, and never talk to us.

### What it does not do

We are honest about scope:

- We are not a hospital EMR. If you have 200 beds, we are not for you.
- We are not a billing system. We do not file insurance claims.
- We are not a marketplace. The two modules we ship are the two modules
  we support.
- We do not have a mobile app yet. Reception runs on a desktop.

### Who should use it

Small clinics. Independent labs. Doctors who have one or two
receptionists and want software that works.

If you are a 5-person clinic in a building where the internet drops
every Tuesday, we built this for you.

### How to try it

Download the app at `<DOWNLOAD_URL>`. The free tier works offline with
no account. When you are ready to add users and backups, sign up in the
app.

We answer support emails ourselves. If something breaks, reply to the
email and one of us will look at it.

- `<FOUNDER_NAME>`

---

## SEO keywords

medical software, local-first, clinic EMR alternative, offline medical
software, patient data privacy, small clinic software, GDPR compliant
medical software