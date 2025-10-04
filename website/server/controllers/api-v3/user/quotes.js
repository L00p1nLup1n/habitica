import { authWithHeaders } from '../../../middlewares/auth';
import { BadRequest } from '../../../libs/errors';

const api = {};

/**
 * @api {get} /api/v3/user/quotes/daily Get today's quote
 * @apiName GetDailyQuote
 * @apiGroup User
 */
api.getDailyQuote = {
  method: 'GET',
  url: '/user/quotes/daily',
  middlewares: [authWithHeaders()],
  async handler (req, res) {
    const { user } = res.locals;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let quote = null;
    let isCustom = false;

    // Check if user has custom quotes enabled and available
    const { customQuotes } = user.preferences;
    if (customQuotes && customQuotes.enabled && customQuotes.quotes.length > 0) {
      // Check if we need to advance to next quote (new day)
      const { lastQuoteDate } = customQuotes;

      if (!lastQuoteDate || new Date(lastQuoteDate).getTime() < today.getTime()) {
        // Move to next quote
        const quotesLength = customQuotes.quotes.length;
        customQuotes.currentQuoteIndex = (customQuotes.currentQuoteIndex + 1) % quotesLength;
        customQuotes.lastQuoteDate = today;
        await user.save();
      }

      quote = customQuotes.quotes[customQuotes.currentQuoteIndex];
      isCustom = true;
    }

    // Fallback to default motivational quotes if no custom quotes
    if (!quote) {
      const defaultQuotes = [
        { text: 'The way to get started is to quit talking and begin doing.', author: 'Walt Disney' },
        { text: 'Don\'t let yesterday take up too much of today.', author: 'Will Rogers' },
        { text: 'It\'s not whether you get knocked down, it\'s whether you get up.', author: 'Vince Lombardi' },
        { text: 'People who are crazy enough to think they can change the world, are the ones who do.', author: 'Rob Siltanen' },
      ];

      // Use day of year to consistently show same quote per day
      const startOfYear = new Date(today.getFullYear(), 0, 0);
      const dayOfYear = Math.floor((today - startOfYear) / (1000 * 60 * 60 * 24));
      quote = defaultQuotes[dayOfYear % defaultQuotes.length];
      isCustom = false;
    }

    res.respond(200, { quote, isCustom });
  },
};

/**
 * @api {post} /api/v3/user/quotes Add a new custom quote
 * @apiName AddCustomQuote
 * @apiGroup User
 */
api.addCustomQuote = {
  method: 'POST',
  url: '/user/quotes',
  middlewares: [authWithHeaders()],
  async handler (req, res) {
    const { user } = res.locals;
    const { text, author } = req.body;

    if (!text || text.trim().length === 0) {
      throw new BadRequest('Quote text is required');
    }

    if (text.length > 500) {
      throw new BadRequest('Quote text must be 500 characters or less');
    }

    const newQuote = {
      text: text.trim(),
      author: author ? author.trim() : '',
      createdAt: new Date(),
    };

    user.preferences.customQuotes.quotes.push(newQuote);
    await user.save();

    res.respond(200, { message: 'Quote added successfully', quote: newQuote });
  },
};

/**
 * @api {put} /api/v3/user/quotes/:index Update a custom quote
 * @apiName UpdateCustomQuote
 * @apiGroup User
 */
api.updateCustomQuote = {
  method: 'PUT',
  url: '/user/quotes/:index',
  middlewares: [authWithHeaders()],
  async handler (req, res) {
    const { user } = res.locals;
    const { index } = req.params;
    const { text, author } = req.body;

    const quoteIndex = parseInt(index, 10);
    const { quotes } = user.preferences.customQuotes;

    if (Number.isNaN(quoteIndex) || quoteIndex < 0 || quoteIndex >= quotes.length) {
      throw new BadRequest('Invalid quote index');
    }

    if (!text || text.trim().length === 0) {
      throw new BadRequest('Quote text is required');
    }

    if (text.length > 500) {
      throw new BadRequest('Quote text must be 500 characters or less');
    }

    quotes[quoteIndex] = {
      text: text.trim(),
      author: author ? author.trim() : '',
      createdAt: quotes[quoteIndex].createdAt || new Date(),
    };

    await user.save();

    res.respond(200, {
      message: 'Quote updated successfully',
      quote: quotes[quoteIndex],
    });
  },
};

/**
 * @api {delete} /api/v3/user/quotes/:index Delete a custom quote
 * @apiName DeleteCustomQuote
 * @apiGroup User
 */
api.deleteCustomQuote = {
  method: 'DELETE',
  url: '/user/quotes/:index',
  middlewares: [authWithHeaders()],
  async handler (req, res) {
    const { user } = res.locals;
    const { index } = req.params;

    const quoteIndex = parseInt(index, 10);
    const { customQuotes } = user.preferences;

    if (Number.isNaN(quoteIndex) || quoteIndex < 0 || quoteIndex >= customQuotes.quotes.length) {
      throw new BadRequest('Invalid quote index');
    }

    customQuotes.quotes.splice(quoteIndex, 1);

    // Adjust current quote index if necessary
    if (customQuotes.currentQuoteIndex >= customQuotes.quotes.length) {
      customQuotes.currentQuoteIndex = Math.max(0, customQuotes.quotes.length - 1);
    }

    await user.save();

    res.respond(200, { message: 'Quote deleted successfully' });
  },
};

/**
 * @api {put} /api/v3/user/quotes/settings Update custom quotes settings
 * @apiName UpdateCustomQuotesSettings
 * @apiGroup User
 */
api.updateSettings = {
  method: 'PUT',
  url: '/user/quotes/settings',
  middlewares: [authWithHeaders()],
  async handler (req, res) {
    const { user } = res.locals;
    const { enabled } = req.body;

    if (typeof enabled !== 'boolean') {
      throw new BadRequest('enabled must be a boolean value');
    }

    user.preferences.customQuotes.enabled = enabled;
    await user.save();

    res.respond(200, { message: 'Settings updated successfully', enabled });
  },
};

export default api;
