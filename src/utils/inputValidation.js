export const handleDecimalInput_Weight = (
  value,
  setValue,
  setError,
  errorKey
) => {
  let val = value;

  // only numbers and decimal allowed
  val = val.replace(/[^0-9.]/g, "");

  // only one decimal allowed
  const parts = val.split(".");
  if (parts.length > 2) return;

  // max 6 digits before decimal
  if (parts[0].length > 6) return;

  // max 2 digits after decimal
  if (parts[1] && parts[1].length > 2) return;

  // block pure 0 or 0.x
  if (Number(val) === 0) {
    setValue("");
    return;
  }

  // starting with zero not allowed
  if (val.length === 1 && val === "0") return;
  if (val.startsWith("0")) return;

  setValue(val);

  if (val !== "" && setError && errorKey) {
    setError((prev) => ({ ...prev, [errorKey]: "" }));
  }
};

export const handleDecimalBlur_Weight = (value, setValue) => {
  if (value !== "") {
    if (!value.includes(".")) {
      setValue(`${value}.00`);
    } else {
      const [intPart, decPart] = value.split(".");
      if (decPart.length === 0) {
        setValue(`${intPart}.00`);
      } else if (decPart.length === 1) {
        setValue(`${intPart}.${decPart}0`);
      }
    }
  }
};

export const commonInputValidator = (value, options = {}) => {
  if (!value) return true;

  const {
    numeric = true,
    allowDecimal = true,
    maxDecimalPlaces = 2,
    minLength = 1,
    maxLength = 50
  } = options;

  // ❌ negative value not allowed
  if (numeric && value.startsWith("-")) {
    return "Negative value not allowed";
  }

  /* =========================
     NUMERIC MODE
  ==========================*/
  if (numeric) {
    // only numbers & decimal
    const regex = allowDecimal ? /^[0-9.]+$/ : /^[0-9]+$/;
    if (!regex.test(value)) {
      return allowDecimal
        ? "Only numbers and decimal allowed"
        : "Only numbers allowed";
    }

    // only one decimal
    if (allowDecimal && (value.match(/\./g) || []).length > 1) {
      return "Only one decimal allowed";
    }

    const [intPart, decPart] = value.split(".");

    // max digits (excluding decimal)
    const digitCount = value.replace(".", "").length;
    if (digitCount > maxLength) {
      return `Maximum ${maxLength} digits allowed`;
    }

    // max decimal places
    if (decPart && decPart.length > maxDecimalPlaces) {
      return `Only ${maxDecimalPlaces} decimal places allowed`;
    }

    // starting zero not allowed
    if (value.startsWith("0")) {
      return "Starting zero not allowed";
    }

    // zero not allowed
    if (Number(value) === 0) {
      return "Value must be greater than 0";
    }

    return true;
  }
else {
  /* =========================
     ALPHANUMERIC MODE
  ==========================*/
  // allow alphabets + numbers + space
  const charRegex = /^[a-zA-Z0-9 ]+$/;
  if (!charRegex.test(value)) {
    return "Special characters are not allowed";
  }

  // min length
  if (value.length < minLength) {
    return `Minimum ${minLength} characters required`;
  }

  // max length
  if (value.length > maxLength) {
    return `Maximum ${maxLength} characters allowed`;
  }
}
  return true;
};
