const scriptCode = `
(function(d, t) {
    var v = d.createElement(t), s = d.getElementsByTagName(t)[0];
    v.onload = function() {
      let endButton;
      console.log("v.onload is being called");
      window.assistant = null;
      const portfolioExtension = {
            name: 'portfolio-extension',
            type: 'response',
            match: ({ trace }) => {
                console.log("Match function is being triggered", trace.type);
                return trace.type === 'triggerPortfolioScript';
            },
            render: async ({ trace, element }) => {
                console.log("Render function is being triggered");
                try {
                    const module = await import('https://ppineapple.github.io/portfolio/script.js');
                    window.assistant = new module.SimpleAssistant('xxxxxxxxxxxx-GEMINI_API_KEY_HERE');
                    await window.assistant.connect();
                    await window.assistant.startCapture();
                    console.log("Payload code after eval");
                    // Add a button that calls assistant.stop()
                    endButton = document.createElement('button');
                    endButton.innerText = 'End Conversation';
                    endButton.style.cssText = 'padding: 10px 20px; background-color: #f44336; color: white; border: none; cursor: pointer; z-index: 9999; pointer-events:auto;';
                    endButton.onclick = function() {
                        if(window.assistant){
                            window.assistant.stop();
                            window.voiceflow.chat.interact({
                                type: 'complete',
                                payload: { action: "end conversation" },
                            });
                            this.remove();
                        }
                    };
                    element.appendChild(endButton);
                } catch (error) {
                    console.error('Error in Module Execution:', error);
                }
            }
      };
      console.log("Before window.voiceflow.chat.load");
      window.voiceflow.chat.load({
          verify: { projectID: '6769c43b8229fe634f4dfb2c' },
          url: 'https://general-runtime.voiceflow.com',
          versionID: 'production',
          assistant: {
              extensions: [portfolioExtension]
          }
      });
      console.log("After window.voiceflow.chat.load");
    }
    console.log("Before v.src");
    v.src = "https://cdn.voiceflow.com/widget-next/bundle.mjs"; v.type = "text/javascript"; s.parentNode.insertBefore(v, s);
    console.log("After v.src");
})(document, 'script');
`;
const scriptElement = document.createElement('script');
scriptElement.type = 'text/javascript';
scriptElement.text = scriptCode;
document.head.appendChild(scriptElement);
