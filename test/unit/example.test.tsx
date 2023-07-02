import {render, waitFor} from "@testing-library/react";
import React from "react";
import {CartApi, ExampleApi} from "../../src/client/api";
import {MemoryRouter} from "react-router";
import {initStore} from "../../src/client/store";
import {Provider} from "react-redux";
import {Application} from "../../src/client/Application";
import events from "@testing-library/user-event";

jest.mock("axios");

const MockServerApi = new ExampleApi('/hw/store');

// @ts-ignore
MockServerApi.getProducts = async () => {
    return Promise.resolve({
        data: [{id: 100, name: "First", price: 1},
            {id: 200, name: "Second", price: 2},
            {id: 300, name: "Third", price: 3}]
    })
}
// @ts-ignore
MockServerApi.getProductById = async (id: number) => {
    return Promise.resolve({
        data: {
            id: 100,
            name: "First",
            price: 1,
            description: "First element",
            material: "Metal",
            color: "Silver"
        }
    });
}
describe('Jest', () => {
    const original = window.location;

    const reloadFn = () => {
        window.location.reload();
    };

    beforeAll(() => {
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: { reload: jest.fn() },
        });
    });

    afterAll(() => {
        Object.defineProperty(window, 'location', { configurable: true, value: original });
    });

    it('Товар добавляется в корзину', async function () {
        const api = MockServerApi;
        const cart = new CartApi();
        const store = initStore(api, cart);

        const application = (
            <MemoryRouter initialEntries={["/catalog/100"]} initialIndex={0}>
                <Provider store={store}>
                    <Application/>
                </Provider>
            </MemoryRouter>
        );

        const {getByTestId} = render(application);

        const btn2 = await waitFor(() =>getByTestId("add-btn"));
        await events.click(btn2);

        const state = await store.getState();
        expect(state.cart['100']).toBeTruthy();
    })


})
