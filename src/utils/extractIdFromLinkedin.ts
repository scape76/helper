function extractIdFromLinkedInURL(url: string) {
  const startIndex = url.indexOf('in/') + 3; // Adding 3 to skip 'in/'
  const endIndex = url.lastIndexOf('/'); // Finding the last '/'

  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    return url.substring(startIndex, endIndex);
  } else {
    return null; // Return null if the pattern is not found
  }
}

export { extractIdFromLinkedInURL };
