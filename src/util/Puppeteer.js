/**
 * Expose a function to the page if it does not exist.
 * WhatsApp Web may destroy a transient target while Puppeteer installs the
 * binding. If the binding is already available in the main page context, the
 * race is harmless and initialization can continue.
 *
 * @param {import('puppeteer').Page} page
 * @param {string} name
 * @param {Function} fn
 */
async function exposeFunctionIfAbsent(page, name, fn) {
    const isTargetCloseError = error =>
        error?.name === 'TargetCloseError' ||
        error?.message?.includes('Target closed');

    const isExposed = async () => {
        try {
            return await page.evaluate(
                name => typeof window[name] === 'function',
                name,
            );
        } catch (error) {
            if (!isTargetCloseError(error)) throw error;
            return false;
        }
    };

    if (await isExposed()) return;

    try {
        await page.exposeFunction(name, fn);
    } catch (error) {
        if (isTargetCloseError(error) && await isExposed()) return;
        throw error;
    }
}

module.exports = { exposeFunctionIfAbsent };
