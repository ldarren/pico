#include <v8.h> // v8 is the Javascript engine used by Node
#include <node.h>
#include <string>

using namespace v8;

#define REQ_FUN_ARG(I, VAR) \
  if (args.Length() <= (I) || !args[I]->IsFunction()) \
    return ThrowException(Exception::TypeError( \
      String::New("Argument " #I " must be a function")));  \
  Local<Function> VAR = Local<Function>::Cast(args[I]);

#define REQ_OBJ_ARG(I, VAR) \
  if (args.Length() <= (I) || !args[I]->IsObject()) \
    return ThrowException(Exception::TypeError( \
      String::New("Argument " #I " must be an object")));  \
  Local<Object> VAR = Local<Object>::Cast(args[I]);

class SampleLogic : node::ObjectWrap {
  private:
  struct LogicBaton{
    SampleLogic *sl;
    Persistent<Object> in;
    std::string out;
    Persistent<Function> cb;
  };

  int count;
  std::string message;

  public:
  SampleLogic():count(0) {}
  ~SampleLogic() {}

  static v8::Persistent<FunctionTemplate> pft;

  static void Init(Handle<Object> target) {
    v8::Local<FunctionTemplate> lft = v8::FunctionTemplate::New(New);
    SampleLogic::pft = v8::Persistent<FunctionTemplate>::New(lft);
    SampleLogic::pft->InstanceTemplate()->SetInternalFieldCount(1);
    SampleLogic::pft->SetClassName(v8::String::NewSymbol("SampleLogic")); // what is the use?

    SampleLogic::pft->InstanceTemplate()->SetAccessor(String::New("message"), GetMessage, SetMessage);

    NODE_SET_PROTOTYPE_METHOD(SampleLogic::pft, "read", Read);

    target->Set(String::NewSymbol("Logic"), SampleLogic::pft->GetFunction()); // new module.Logic
  }

  static Handle<Value> New(const Arguments &args){
    HandleScope scope;
    SampleLogic *logic = new SampleLogic();
    logic->message = "Hello World";
    logic->Wrap(args.This());
    return args.This();
  }

  static v8::Handle<Value> Read(const Arguments &args){
    v8::HandleScope scope;
    REQ_OBJ_ARG(0, obj);
    REQ_FUN_ARG(1, cb);
    SampleLogic *logic = node::ObjectWrap::Unwrap<SampleLogic>(args.This());

    LogicBaton *baton = new LogicBaton();
    baton->sl = logic;
    baton->in = Persistent<Function>::New(obj);
    baton->cb = Persistent<Function>::New(cb);

    logic->Ref();

    eio_custom(EIO_Hello, EIO_PRI_DEFAULT, EIO_AfterHello, baton);
    ev_ref(EV_DEFAULT_UC);

    return v8::String::New(logic->message.c_str());
  }

  static void EIO_Hello(eio_req *req){
    LogicBaton *baton = static_cast<LogicBaton *>(req->data);
    std::string out = baton->in->Get(String::New("first"));
    baton->out = out;
  }

  static int EIO_AfterHello(eio_req *req){
    HandleScope scope;
    LogicBaton *baton = static_cast<LogicBaton *>(req->data);
    ev_unref(EV_DEFAULT_UC);
    baton->sl->Unref();

    Handle<Object> obj = Object::New();
    obj->Set(String::New("foo"), String::New("I'm foo"));
    obj->Set(String::New("bar"), String::New(baton->out));

    Handle<Value> argv[1] = {obj};

    TryCatch try_catch;

    baton->cb->Call(Context::GetCurrent()->Global(), 1, argv);

    if (try_catch.HasCaught()){
      node::FatalException(try_catch);
    }

    baton->out.Dispose();
    baton->cb.Dispose();

    delete baton;
    return 0;
  }

  static v8::Handle<Value> GetMessage(v8::Local<v8::String> property, const v8::AccessorInfo &info){
    SampleLogic *logic = node::ObjectWrap::Unwrap<SampleLogic>(info.Holder());
    return v8::String::New(logic->message.c_str());
  }

  static void SetMessage(Local<String> property, Local<Value> value, const AccessorInfo &info){
    SampleLogic *logic = node::ObjectWrap::Unwrap<SampleLogic>(info.Holder());
    v8::String::Utf8Value v8str(value);
    logic->message = *v8str;
  }
};

v8::Persistent<FunctionTemplate> SampleLogic::pft;
extern "C"{
  static void init(Handle<Object> target){
    SampleLogic::Init(target);
  }

  NODE_MODULE(sample_logic, init); // first parameter must same as filename
}
