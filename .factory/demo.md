# Gentle Nudge demo sandbox

Open <https://payment-cadence.sociobot.in/demo> or use `/?demo=1` to enter the one-click sample.

The demo starts with three realistic invoices: Acorn Architecture is due today, Haven Ceramics is eight days overdue after a first reminder, and Juniper Learning is due in four days. The sample shows ready drafts, private context, a future invoice, and a later cadence step.

The persistent **Demo — sample data, nothing is saved** banner identifies the sandbox. **Reset demo** clears and reseeds only the sample. **Start for real** leaves the sample and opens the ordinary empty workspace.

Demo records use the separate IndexedDB database `demo:gentle-nudge`. Real records use `gentle-nudge`. The application chooses the database before any storage read or write, so demo actions cannot read or change real records.
