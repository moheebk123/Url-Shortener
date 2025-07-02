import * as services from "../services/index.services.js";

export const handleRoot = async (req, res) => {
  try {
    let isVerified = false;
    const { links } = await services.loadLinks({ limit: 5 });
    const { user } = req;
    if (user) {
      const loggedUser = await services.getUserById(user.id);

      if (loggedUser && loggedUser.isVerified) {
        isVerified = true;
      }
    }

    return res.render("general/index", {
      links,
      host: req.host,
      errors: req.flash("errors"),
      successes: req.flash("successes"),
      isVerified,
      homePage: true,
      userLinksPage: false,
      totalPages: 0,
    });
  } catch (error) {
    console.log(error);

    req.flash("errors", "Internal Server Error");
    return res.redirect("/");
  }
};

export const handleAbout = (_, res) => {
  return res.render("general/about");
};

export const handleAllLinks = async (req, res) => {
  const page = Number(req.query.page);
  if (!page || page <= 0) {
    return res.redirect("/links?page=1");
  }

  try {
    const { links, totalLinks } = await services.loadLinks({
      limit: 10,
      skip: (page - 1) * 10,
    });

    const totalPages = Math.ceil(totalLinks / 10);
    const startPage = Math.max(1, page - 1);
    const endPage = Math.min(totalPages, page + 1);

    if (totalLinks > 0 && page > totalPages) {
      return res.redirect("/links?page=1");
    }

    return res.render("general/links", {
      links,
      host: req.host,
      totalPages,
      startPage,
      endPage,
      currentPage: page,
      userLinksPage: false,
      homePage: false,
    });
  } catch (error) {
    console.log(error);

    req.flash("errors", "Internal Server Error");
    return res.redirect("/links?page=1");
  }
};
