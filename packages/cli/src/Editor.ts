var chalk = require("chalk");
var ExternalEditor = require("external-editor").ExternalEditor;
var Base = require("inquirer/lib/prompts/base");
var observe = require("inquirer/lib/utils/events");
var { Subject } = require("rxjs");

export default class EditorPrompt extends Base {
  /**
   * Start the Inquiry session
   * @param  {Function} cb      Callback when prompt is done
   * @return {this}
   */

  _run(cb: any) {
    this.done = cb;

    this.editorResult = new Subject();

    // Open Editor on "line" (Enter Key)
    var events = observe(this.rl);
    this.lineSubscription = events.line.subscribe(
      this.startExternalEditor.bind(this)
    );

    // Trigger Validation when editor closes
    var validation = this.handleSubmitEvents(this.editorResult);
    validation.success.forEach(this.onEnd.bind(this));
    validation.error.forEach(this.onError.bind(this));

    // Prevents default from being printed on screen (can look weird with multiple lines)
    this.currentText = this.opt.default;
    this.opt.default = null;

    this.editor = new ExternalEditor(this.currentText);

    // Init
    this.render();

    return this;
  }

  /**
   * Render the prompt to screen
   * @return {EditorPrompt} self
   */

  render(error?: any) {
    var bottomContent = "";
    var message = this.getQuestion();

    if (this.status === "answered") {
      message += chalk.dim("Received");
    } else {
      message += chalk.dim("Press <enter> to launch your preferred editor.");
    }

    if (error) {
      bottomContent = chalk.red(">> ") + error;
    }

    this.screen.render(message, bottomContent);
  }

  /**
   * Launch $EDITOR on user press enter
   */

  startExternalEditor() {
    // Pause Readline to prevent stdin and stdout from being modified while the editor is showing
    this.rl.pause();
    this.editor.runAsync(this.endExternalEditor.bind(this));
  }

  endExternalEditor(error: any, result: any) {
    this.rl.resume();
    if (error) {
      this.editorResult.error(error);
    } else {
      this.editorResult.next(result);
    }
  }

  onEnd(state: any) {
    this.editorResult.unsubscribe();
    this.lineSubscription.unsubscribe();
    this.editor.cleanup();
    this.answer = state.value;
    this.status = "answered";
    // Re-render prompt
    this.render();
    this.screen.done();
    this.done(this.answer);
  }

  onError(state: any) {
    this.render(state.isValid);
  }
}
