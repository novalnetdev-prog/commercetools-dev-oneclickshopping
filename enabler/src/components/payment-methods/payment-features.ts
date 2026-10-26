type Features = {
  business: boolean;
  oneClick: boolean;
  savedPayments: Array<{ id: string; label: string }>;
};
const text = {
  en: {
    save: "Save for future purchase",
    card: "Add new card details",
    account: "Add new account details",
  },
  de: {
    save: "Speichern für zukünftige Einkäufe",
    card: "Neue Kreditkarte hinzufügen",
    account: "Neue Kontodaten hinzufügen",
  },
};
export class PaymentFeatures {
  private radios?: HTMLFieldSetElement;
  private checkbox?: HTMLInputElement;
  private newFields: Array<{ element: HTMLElement; display: string }> = [];
  private saveLabel?: HTMLLabelElement;
  public business = false;
  get savedPaymentId(): string | undefined {
    return (
      this.radios?.querySelector<HTMLInputElement>("input:checked")?.value ||
      undefined
    );
  }
  get paymentFields(): { savedPaymentId?: string; savePayment?: boolean } {
    return this.savedPaymentId
      ? { savedPaymentId: this.savedPaymentId }
      : this.checkbox?.checked
        ? { savePayment: true }
        : {};
  }
  async mount(options: {
    container: Element;
    processorUrl: string;
    sessionId: string;
    type: string;
    locale: "en" | "de";
    fields: string[];
    dob?: string;
  }): Promise<void> {
    const response = await fetch(
      `${options.processorUrl}/paymentFeatures?paymentMethod=${encodeURIComponent(options.type)}`,
      {
        headers: { "X-Session-Id": options.sessionId },
        cache: "no-store",
      },
    );
    if (!response.ok) throw new Error("Unable to load payment settings.");
    const data: Features = await response.json();
    this.business = data.business === true;
    const dob = options.dob
      ? options.container.querySelector<HTMLInputElement>(options.dob)
      : null;
    if (this.business && dob) {
      const field = dob.parentElement;
      if (field) field.style.display = "none";
      dob.disabled = true;
      dob.required = false;
    }
    if (!data.oneClick) return;
    const dictionary = text[options.locale];
    this.newFields = options.fields
      .map((selector) => options.container.querySelector<HTMLElement>(selector))
      .filter((element): element is HTMLElement => Boolean(element))
      .map((element) => ({ element, display: element.style.display }));
    const payments = Array.isArray(data.savedPayments)
      ? data.savedPayments.slice(0, 3)
      : [];
    if (payments.length) {
      this.radios = document.createElement("fieldset");
      this.radios.style.border = "0";
      this.radios.style.padding = "0";
      const legend = document.createElement("legend");
      legend.textContent =
        options.type === "CREDITCARD" ? "Credit/Debit Cards" : "IBAN";
      this.radios.appendChild(legend);
      [
        ...payments,
        {
          id: "",
          label:
            options.type === "CREDITCARD"
              ? dictionary.card
              : dictionary.account,
        },
      ].forEach((payment, index) => {
        const label = document.createElement("label");
        label.style.display = "block";
        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = `nn_saved_${options.type}`;
        radio.value = payment.id;
        radio.checked = index === 0;
        radio.addEventListener("change", () => this.toggle());
        label.append(radio, document.createTextNode(` ${payment.label}`));
        this.radios!.appendChild(label);
      });
      options.container.prepend(this.radios);
    }
    this.saveLabel = document.createElement("label");
    this.saveLabel.style.display = "block";
    this.checkbox = document.createElement("input");
    this.checkbox.type = "checkbox";
    this.checkbox.checked = false;
    this.saveLabel.append(
      this.checkbox,
      document.createTextNode(` ${dictionary.save}`),
    );
    const last = this.newFields[this.newFields.length - 1]?.element;
    if (last) last.after(this.saveLabel);
    else options.container.appendChild(this.saveLabel);
    this.toggle();
  }
  private toggle(): void {
    const saved = Boolean(this.savedPaymentId);
    for (const field of this.newFields)
      field.element.style.display = saved ? "none" : field.display;
    if (this.saveLabel) this.saveLabel.style.display = saved ? "none" : "block";
    if (saved && this.checkbox) this.checkbox.checked = false;
  }
}
