import { UrlShortener } from "../models/links.model.js";

export const loadLinks = async () => {
  const links = await UrlShortener.find().populate("createdBy");
  links.map(
    (link) => (link.createdBy = { ...link.createdBy, email: "", password: "" })
  );
  return links;
};

export const addLink = async (link) => {
  return await UrlShortener.create(link);
};

export const getLink = async (shortCode) => {
  return await UrlShortener.findOne({ shortCode });
};

export const getLinkById = async (id) => {
  return await UrlShortener.findById(id);
};

export const updateLink = async (id, updatedShortUrl) => {
  return await UrlShortener.findByIdAndUpdate(id, updatedShortUrl);
};

export const deleteLink = async (id) => {
  return await UrlShortener.findByIdAndDelete(id);
};
