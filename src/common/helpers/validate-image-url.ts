export const validateImageUrl = (url: string) => {
  try {
    const ic = new URL(url);
    return (
      ic.protocol === "data:" ||
      ic.protocol === "https:" ||
      ic.protocol === document.location.protocol
    );
  } catch {
    return false;
  }
};
