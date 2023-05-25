import {
  $,
  component$,
  useSignal,
  useStylesScoped$,
  useVisibleTask$,
} from "@builder.io/qwik";
import { type RequestHandler, type DocumentHead, routeLoader$ } from "@builder.io/qwik-city";

import Counter from "~/components/starter/counter/counter";
import Hero from "~/components/starter/hero/hero";
import Infobox from "~/components/starter/infobox/infobox";
import Starter from "~/components/starter/next-steps/next-steps";
import { chatConnection, sendMessage, type ChatMessage, getCurrentMessages } from "./realtime-chat";

export const onGet: RequestHandler = async (event) => {
  const userId = event.cookie.get("userId")?.value;
  if (!userId) {
    event.cookie.set("userId", crypto.randomUUID());
  }
};

export const useChatMessages = routeLoader$(async (event)=> { 
  const messages = await getCurrentMessages.call(event);
  return messages;
})

export default component$(() => {
  const initialMessages = useChatMessages();
  return (
    <>
      <RealtimeChat initialMessages={initialMessages.value} />
      <Hero />
      <Starter />

      <div role="presentation" class="ellipsis"></div>
      <div role="presentation" class="ellipsis ellipsis-purple"></div>

      <div class="container container-center container-spacing-xl">
        <h3>
          You can <span class="highlight">count</span>
          <br /> on me
        </h3>
        <Counter />
      </div>

      <div class="container container-flex">
        <Infobox>
          <div q:slot="title" class="icon icon-cli">
            CLI Commands
          </div>
          <>
            <p>
              <code>npm run dev</code>
              <br />
              Starts the development server and watches for changes
            </p>
            <p>
              <code>npm run preview</code>
              <br />
              Creates production build and starts a server to preview it
            </p>
            <p>
              <code>npm run build</code>
              <br />
              Creates production build
            </p>
            <p>
              <code>npm run qwik add</code>
              <br />
              Runs the qwik CLI to add integrations
            </p>
          </>
        </Infobox>

        <div>
          <Infobox>
            <div q:slot="title" class="icon icon-apps">
              Example Apps
            </div>
            <p>
              Have a look at the <a href="/demo/flower">Flower App</a> or the{" "}
              <a href="/demo/todolist">Todo App</a>.
            </p>
          </Infobox>

          <Infobox>
            <div q:slot="title" class="icon icon-community">
              Community
            </div>
            <ul>
              <li>
                <span>Questions or just want to say hi? </span>
                <a href="https://qwik.builder.io/chat" target="_blank">
                  Chat on discord!
                </a>
              </li>
              <li>
                <span>Follow </span>
                <a href="https://twitter.com/QwikDev" target="_blank">
                  @QwikDev
                </a>
                <span> on Twitter</span>
              </li>
              <li>
                <span>Open issues and contribute on </span>
                <a href="https://github.com/BuilderIO/qwik" target="_blank">
                  GitHub
                </a>
              </li>
              <li>
                <span>Watch </span>
                <a href="https://qwik.builder.io/media/" target="_blank">
                  Presentations, Podcasts, Videos, etc.
                </a>
              </li>
            </ul>
          </Infobox>
        </div>
      </div>
    </>
  );
});

export const RealtimeChat = component$((props: { 
  initialMessages?: Array<ChatMessage>
}) => {
  useStylesScoped$(` 
    section { 
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 600px;
      margin: auto;
      max-width: 40rem;
      width: 90%;
    }
    h1 { 
      font-size: 60px;
      margin-bottom: 10px;
    }
    textarea { 
      padding: 4px;
      outline: none;
      border-radius: 8px;
      min-height: 70px;
      font-size: inherit;
      font-family: inherit;
      width: 100%;
      background-color: #e4d9ef
    }
    button { 
      padding: 12px;
      font-weight: bold;
      font-size: 24px;
      margin-top: 10px;
    }
    .messages { 
      flex-grow: 1;
      padding: 20px;
      width: 100%;
    }
    .user { 
      font-weight: bold;
    }
  `);

  const messages = useSignal<Array<ChatMessage>>(props.initialMessages || []);
  useVisibleTask$(() => {
    async function connectAndListen() {
      try {
        const stream = await chatConnection();
        for await (const messagesUpdate of stream) {
          messages.value = messagesUpdate;
        }
        setTimeout(connectAndListen, 500);
      } catch (e) {
        console.log("Had error while listening to chat stream", e);
        setTimeout(connectAndListen, 500);
      }
    }

    connectAndListen();
  });

  const userMessage = useSignal("");

  const submitMessage = $(() => {
    sendMessage(userMessage.value).then((outcome) => {
      if (outcome === "No user id in cookies") {
        window.location.reload();
      } else {
        userMessage.value = "";
      }
    });
  });

  return (
    <section>
      <h1>Chat</h1>
      <div class="messages">
        {messages.value.map((message, i) => {
          return (
            <div key={message.user + message.message + i}>
              <span class="user">{message.user}</span>
              {`: `}
              <span>{message.message}</span>
            </div>
          );
        })}
      </div>
      <textarea
        autoFocus
        value={userMessage.value}
        onInput$={(event) => {
          const target = event.target as HTMLTextAreaElement;
          userMessage.value = target.value;
        }}
        onKeyDown$={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            submitMessage();
          }
        }}
      />
      <button onClick$={submitMessage}>Submit</button>
    </section>
  );
});

export const head: DocumentHead = {
  title: "Welcome to Qwik",
  meta: [
    {
      name: "description",
      content: "Qwik site description",
    },
  ],
};
