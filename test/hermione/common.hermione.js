const axios = require("axios");
const {assert} = require('chai');

const bug = process.env.BUG_ID;

describe('Тесты скриншотами', () => {
    const checkScreen = async (browser, url) => {
        [1920, 1480, 1000, 800, 428].forEach(w => {
            it(w + " на 1080", async function () {
                await browser.url("http://localhost:3000/hw/store" + url + "?bug-id" + bug);
                await browser.setWindowSize(w, 1080);
                await browser.assertView(w + "x1080", "body");
            });
        })
    }
    it('Главная (адаптивность)', async function () {
        await checkScreen(this.browser, '')
    })
    it('Доставка', async function () {
        await checkScreen(this.browser, '/delivery')
    })
    it('Контакты', async function () {
        await checkScreen(this.browser, '/contacts')
    })
    it('Кнопка добавить', async function () {
        const puppeteer = await this.browser.getPuppeteer();
        const [page] = await puppeteer.pages();

        await page.goto("http://localhost:3000/hw/store/catalog/0?bug_id=" + bug);

        await this.browser.assertView('add-btn', '.ProductDetails-AddToCart');
    })
})

it('Правильные данные', async function () {
    const {data: products} = await axios.get(`http://localhost:3000/hw/store//api/products?bug_id=` + bug);
    const puppeteer = await this.browser.getPuppeteer();
    const [page] = await puppeteer.pages();

    await page.goto("http://localhost:3000/hw/store/catalog?bug_id=" + bug);
    for (const p of products) {
        const e = await this.browser.$('[data-testid="name' + p.id + '"]');
        const name = await e.getText();
        assert.equal(name, p.name, 'Неправильное имя товара');
    }
})

it("Добавление товара", async function () {
    const puppeteer = await this.browser.getPuppeteer();
    const [page] = await puppeteer.pages();

    await page.goto("http://localhost:3000/hw/store/catalog/0?bug_id=" + bug);
    const cart = {
        key: "example-store-cart",
        data: {}
    }
    await page.evaluate(cart => {
        window.localStorage.setItem(cart.key, JSON.stringify(cart.data));
    }, cart);

    const btn = await page.waitForSelector(".ProductDetails-AddToCart");
    await btn.click();
    const cartLink = await this.browser.$('[data-testid="cart"]');
    const text = await cartLink.getText();
    assert.equal(text, 'Cart (1)', 'Не работает кнопка добавления');
    await page.reload();
    await page.waitForSelector(".navbar", {timeout: 1000});

    await page.evaluate(cart => {
        window.localStorage.setItem(cart.key, JSON.stringify(cart.data));
    }, cart);

    await this.browser.assertView("reload", ".navbar");
});

it('Все товары доступны', async function () {
    const {data: products} = await axios.get(`http://localhost:3000/hw/store//api/products?bug_id=` + bug);
    const puppeteer = await this.browser.getPuppeteer();
    const [page] = await puppeteer.pages();

    for (const p of products) {
        await page.goto("http://localhost:3000/hw/store/catalog/" + p.id + "?bug_id=" + bug);
        const details = await page.waitForSelector('[data-testid="product-details"]')
        assert.ok(details, 'Элемент не загрузился');
    }
})

it('Бургер не пропадает', async function () {
    await this.browser.setWindowSize(428, 1080);
    const puppeteer = await this.browser.getPuppeteer();
    const [page] = await puppeteer.pages();

    await page.goto("http://localhost:3000/hw/store/?bug_id=" + bug);

    const link = await this.browser.$('.Application-Toggler');
    await link.click();
    const catalog = await this.browser.$('.nav-link[data-testid="catalog"]');
    await catalog.click();
    await this.browser.assertView('burger', '.container');
})

it('Процесс оформления заказа', async function () {
    const puppeteer = await this.browser.getPuppeteer();
    const [page] = await puppeteer.pages();
    const cart = {
        key: "example-store-cart",
        data: {0: {name: "a", price: 1, count: 1}}
    }
    await page.goto('http://localhost:3000/hw/store');
    await page.evaluate(cart => {
        window.localStorage.setItem(cart.key, JSON.stringify(cart.data));
    }, cart);

    await this.browser.url(`http://localhost:3000/hw/store/cart?bug_id=` + bug);
    await page.waitForSelector('.mb-3');

    const name = await this.browser.$('.Form-Field_type_name');
    const phone = await this.browser.$('.Form-Field_type_phone');
    const address = await this.browser.$('.Form-Field_type_address');

    await name.setValue('a');
    await phone.setValue('+71112223344');
    await address.setValue('a');

    await this.browser.$('.Form-Submit').click();

    if (await name.isDisplayed() && await phone.isDisplayed()) {
        const invalidName = await name.getAttribute('class');
        const invalidPhone = await phone.getAttribute('class');

        assert.ok(!invalidName.includes('is-invalid'), 'Неправильная валидация имени');
        assert.ok(!invalidPhone.includes('is-invalid'), 'Неправильная валидация телефона');
    }

    const alert = await this.browser.$('.Cart-SuccessMessage');
    assert.equal(await alert.isDisplayed(), true, 'Не оформляется заказ');

    const valid = await alert.getAttribute('class');
    assert.include(valid, 'alert-success', 'Неправильный цвет заказа');
});

it('Корректный номер заказа', async () => {
    const formData = {name: 'A', phone: '+71112223344', address: 'A',};

    const cart = {
        0: {id: 0, name: 'First', price: 100, count: 1},
        1: {id: 1, name: 'Second', price: 200, count: 1},
    };

    const order = {form: formData, cart: cart,};

    const response = await axios.post(`http://localhost:3000/hw/store/api/checkout?bug_id=` + bug, order);
    const orderId = response.data.id;

    assert.ok(orderId < 100);
});
